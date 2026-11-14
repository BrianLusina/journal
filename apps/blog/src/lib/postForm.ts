/** POSTs `values` as JSON to one of the form functions in api/, and rejects unless it answers 2xx. */
export async function postForm(url: string, values: object): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }
}
