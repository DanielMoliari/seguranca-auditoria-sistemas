/**
 * Busca todas as chaves salvas no armazenamento local da extensão.
 * @returns {Promise<Array>} Uma promessa que resolve para um array de chaves.
 */
export async function getKeys() {
    const result = await chrome.storage.local.get('userKeys');
    return result.userKeys || [];
}

/**
 * Salva um array de chaves no armazenamento local da extensão.
 * @param {Array} keys - O array de chaves a ser salvo.
 */
export async function saveKeys(keys) {
    await chrome.storage.local.set({ userKeys: keys });
}