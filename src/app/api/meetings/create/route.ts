import { POST as handlePost } from "../route";

export async function POST(request: Request) {
  return handlePost(request);
}
