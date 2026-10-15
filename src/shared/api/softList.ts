export const softList = <T>(request: Promise<{ data: T[] }>): Promise<T[]> =>
  request.then((response) => response.data).catch(() => [] as T[])
