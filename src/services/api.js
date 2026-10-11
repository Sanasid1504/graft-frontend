const API_BASE_URL = "http://127.0.0.1:8000";

export async function predictFraud(accountsFile, transactionsFile) {
  const formData = new FormData();

  formData.append("accounts_file", accountsFile);
  formData.append("transactions_file", transactionsFile);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Prediction failed");
  }

  return data;
}