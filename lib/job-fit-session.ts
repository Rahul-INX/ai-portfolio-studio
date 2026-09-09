export function jobFitSessionFrom(request: Request) {
  const value = request.headers.get("cookie")?.match(/(?:^|;\s*)job_fit_session=([^;]+)/)?.[1];
  return value ? decodeURIComponent(value) : "";
}
