/**
 * Envia uma chave pública para o servidor público.
 * @param {string} publicKeyArmored - A chave pública em formato de texto (armored).
 * @returns {Promise<{success: boolean, message: string}>} Um objeto indicando sucesso ou falha.
 */
export async function uploadKey(publicKeyArmored) {
    try {
        const response = await fetch('https://keys.openpgp.org/vks/v1/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keytext: publicKeyArmored })
        });

        if (response.ok) {
            const jsonResponse = await response.json();
            return { success: true, message: "Chave enviada! Verifique seu e-mail para confirmação.", response: jsonResponse };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, message: `Servidor respondeu com erro: ${errorData.error || response.status}` };
        }
    } catch (error) {
        console.error("Erro de rede ao enviar chave:", error);
        return { success: false, message: `Não foi possível enviar a chave: ${error.message}` };
    }
}

export async function requestConfirmationKey(token, email) {
    try {
        const response = await fetch('https://keys.openpgp.org/vks/v1/request-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: token,
                addresses: [email] 
            })
        });

        if (response.ok) {
            return { success: true, message: "Chave enviada! Verifique seu e-mail para confirmação." };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, message: `Servidor respondeu com erro: ${errorData.error || response.status}` };
        }
    } catch (error) {
        console.error("Erro de rede ao enviar chave:", error);
        return { success: false, message: `Não foi possível enviar a chave: ${error.message}` };
    }
}