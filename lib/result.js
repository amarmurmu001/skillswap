export function ok(data) {
  return { success: true, data, error: null };
}

export function fail(error) {
  return { success: false, data: null, error: typeof error === 'string' ? error : error?.message || 'An error occurred' };
}

export function tryCatch(fn) {
  try {
    const result = fn();
    return result?.then ? result.then(ok).catch(fail) : ok(result);
  } catch (err) {
    return fail(err);
  }
}

export async function tryAsync(fn) {
  try {
    const data = await fn();
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}
