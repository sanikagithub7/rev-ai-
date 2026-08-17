export interface CreateGoogleMeetParams {
  title: string;
  description?: string;
  startDateTime: string; // ISO 8601 string
  endDateTime: string;   // ISO 8601 string
  timezone: string;
  participantEmail: string;
  participantName?: string;
  accessToken: string;
}

export interface GoogleMeetResult {
  success: boolean;
  meetUrl?: string;
  eventId?: string;
  htmlLink?: string;
  error?: string;
  errorCode?: string;
}

export interface GoogleOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface GoogleConsentUrlResult {
  url: string | null;
  state?: string;
  error?: string;
}

export interface GoogleCalendarConnectionResult {
  connected: boolean;
  tokenRecord?: any;
  accessToken?: string;
  expiresAt?: string;
  lastUpdated?: string;
  error?: string;
}

/**
 * Returns official Google OAuth 2.0 Consent URL for Calendar API scopes with state parameter.
 */
export function getGoogleOAuthConsentUrl(redirectUri: string, stateNonce?: string): GoogleConsentUrlResult {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";

  if (!clientId || clientId.includes("YOUR_GOOGLE_CLIENT_ID") || clientId.includes("your-google-client-id")) {
    return {
      url: null,
      error: "Google Calendar connection is not configured. Please contact the administrator.",
    };
  }

  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email"
  );

  const statePayload = stateNonce || `rev-state-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const encodedState = encodeURIComponent(statePayload);

  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&access_type=offline&prompt=consent&include_granted_scopes=true&state=${encodedState}`;

  return { url, state: statePayload };
}

/**
 * Server-side exchange of OAuth authorization code for Access Token & Refresh Token.
 */
export async function exchangeGoogleOAuthCode(
  code: string,
  redirectUri: string
): Promise<{ success: boolean; tokens?: GoogleOAuthTokenResponse; error?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  if (!clientId || !clientSecret || clientId.includes("YOUR_GOOGLE") || clientSecret.includes("YOUR_GOOGLE")) {
    return {
      success: false,
      error: "Google Calendar connection is not configured. Please contact the administrator.",
    };
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      return {
        success: false,
        error: errData.error_description || errData.error || "Failed to exchange Google authorization code.",
      };
    }

    const tokens: GoogleOAuthTokenResponse = await res.json();
    return { success: true, tokens };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error during Google OAuth token exchange." };
  }
}

/**
 * Server-side refresh of an expired Google Access Token using Refresh Token.
 */
export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<{ success: boolean; accessToken?: string; expiresIn?: number; error?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: errData.error_description || "Google Calendar connection expired. Please reconnect Google Calendar." };
    }

    const data = await res.json();
    return {
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error refreshing Google access token." };
  }
}

/**
 * Single Source of Truth helper function to resolve Google Calendar connection status for a user/organization.
 * Automatically refreshes access token if expired and refresh_token is present.
 */
export async function getGoogleCalendarConnection(
  supabase: any,
  userId: string,
  organizationId: string
): Promise<GoogleCalendarConnectionResult> {
  if (!supabase || !organizationId) {
    return { connected: false, error: "Invalid parameters" };
  }

  try {
    // 1. Query for user/org token
    let query = supabase
      .from("user_google_tokens")
      .select("*")
      .eq("organization_id", organizationId);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: records } = await query.order("updated_at", { ascending: false }).limit(1);

    let tokenRecord = Array.isArray(records) && records.length > 0 ? records[0] : null;

    // 2. Fallback lookup for workspace token if specific user record is not found
    if (!tokenRecord) {
      const { data: fallbackRecords } = await supabase
        .from("user_google_tokens")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (Array.isArray(fallbackRecords) && fallbackRecords.length > 0) {
        tokenRecord = fallbackRecords[0];
      }
    }

    if (!tokenRecord || !tokenRecord.access_token) {
      return { connected: false };
    }

    let accessToken = tokenRecord.access_token;
    const expiresAtMs = new Date(tokenRecord.expires_at).getTime();

    // 3. Auto-refresh access token if expired (within 60 seconds buffer)
    if (expiresAtMs <= Date.now() + 60000 && tokenRecord.refresh_token) {
      const refreshRes = await refreshGoogleAccessToken(tokenRecord.refresh_token);
      if (refreshRes.success && refreshRes.accessToken) {
        accessToken = refreshRes.accessToken;
        const newExpiresAt = new Date(Date.now() + (refreshRes.expiresIn || 3600) * 1000).toISOString();
        const updatedAt = new Date().toISOString();

        await supabase
          .from("user_google_tokens")
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt,
            updated_at: updatedAt,
          })
          .eq("id", tokenRecord.id);

        tokenRecord.access_token = accessToken;
        tokenRecord.expires_at = newExpiresAt;
        tokenRecord.updated_at = updatedAt;
      } else {
        return {
          connected: false,
          error: "Google Calendar connection expired. Please reconnect Google Calendar.",
        };
      }
    }

    return {
      connected: true,
      tokenRecord,
      accessToken,
      expiresAt: tokenRecord.expires_at,
      lastUpdated: tokenRecord.updated_at,
    };
  } catch (err: any) {
    return { connected: false, error: err.message || "Failed to resolve Google Calendar connection." };
  }
}

/**
 * Creates a real Google Calendar Event with an automated Google Meet video conference link.
 * Uses conferenceData.createRequest with type 'hangoutsMeet'.
 */
export async function createGoogleCalendarEventWithMeet(
  params: CreateGoogleMeetParams
): Promise<GoogleMeetResult> {
  const { title, description, startDateTime, endDateTime, timezone, participantEmail, participantName, accessToken } = params;

  if (!accessToken) {
    return {
      success: false,
      errorCode: "NOT_CONNECTED",
      error: "Connect Google Calendar before scheduling a meeting.",
    };
  }

  if (!participantEmail || !participantEmail.includes("@")) {
    return {
      success: false,
      errorCode: "INVALID_MEETING_DATA",
      error: "A valid participant email address is required.",
    };
  }

  try {
    const eventPayload = {
      summary: title,
      description: description || "Sales Demo & Discovery Call scheduled via Rev AI Autopilot.",
      start: {
        dateTime: startDateTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: timezone,
      },
      attendees: [
        {
          email: participantEmail.trim(),
          displayName: participantName || participantEmail.split("@")[0],
        },
      ],
      conferenceData: {
        createRequest: {
          requestId: `rev-meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!res.ok) {
      const errData = await res.json();
      const apiMsg = errData?.error?.message || "";
      const errReason = errData?.error?.errors?.[0]?.reason || "";
      let code = "CALENDAR_EVENT_CREATE_FAILED";
      let cleanError = apiMsg || `Google Calendar API returned error (${res.status})`;

      if (apiMsg.includes("disabled") || apiMsg.includes("has not been used in project") || errReason === "accessNotConfigured") {
        code = "CALENDAR_API_DISABLED";
        cleanError = "Google Calendar API is newly enabled for project 47371793037. If you recently enabled it, Google Cloud propagation takes 1-3 minutes worldwide. Please click 'SCHEDULE WITH GOOGLE MEET' again in 1-2 minutes.";
      } else if (errReason === "insufficientPermissions" || errReason === "insufficientScope" || apiMsg.toLowerCase().includes("insufficient")) {
        code = "GOOGLE_CALENDAR_SCOPE_MISSING";
        cleanError = "Google Calendar needs permission to create events. Please click 'RECONNECT GOOGLE CALENDAR' and grant Calendar access.";
      } else if (res.status === 401) {
        code = "TOKEN_EXPIRED";
        cleanError = "Your Google Calendar connection expired. Please reconnect Google Calendar.";
      } else if (res.status === 403) {
        code = "PERMISSION_DENIED";
        cleanError = apiMsg || "Your Google account does not have permission to create Calendar events.";
      }

      return {
        success: false,
        errorCode: code,
        error: cleanError,
      };
    }

    const data = await res.json();

    // Extract genuine Google Meet URL from event response
    const meetUrl =
      data.hangoutLink ||
      data.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri ||
      data.conferenceData?.entryPoints?.[0]?.uri;

    if (!meetUrl) {
      return {
        success: false,
        errorCode: "MEET_CREATION_FAILED",
        error: "Google Calendar event was created, but Google Meet link was not returned by Google API.",
      };
    }

    return {
      success: true,
      meetUrl,
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (err: any) {
    return {
      success: false,
      errorCode: "CALENDAR_EVENT_CREATE_FAILED",
      error: err.message || "Failed to reach Google Calendar API.",
    };
  }
}

/**
 * Cancels/Deletes a Google Calendar Event by Event ID.
 */
export async function deleteGoogleCalendarEvent(
  eventId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!eventId || !accessToken) {
    return { success: false, error: "Event ID and access token required to cancel Google Calendar event." };
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const errData = await res.json();
      return { success: false, error: errData?.error?.message || "Failed to delete Google Calendar event." };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to contact Google Calendar API." };
  }
}
