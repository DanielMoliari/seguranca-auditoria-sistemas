console.log("Cryptomail: content.js carregado e pronto.");

const recipientKeysCache = new Map();

/**
 * Procura pela chave pública de um e-mail e a armazena no cache.
 * @param {string} email - O endereço de e-mail do destinatário.
 * @returns {Promise<string|null>} A chave pública em formato de texto ou null.
 */
async function findAndCacheKey(email) {
    if (recipientKeysCache.has(email)) {
        return recipientKeysCache.get(email);
    }
    try {
        const response = await fetch(`https://keys.openpgp.org/vks/v1/by-email/${encodeURIComponent(email)}`);
        if (response.ok) {
            const publicKey = await response.text();
            recipientKeysCache.set(email, publicKey);
            return publicKey;
        }
        recipientKeysCache.set(email, null);
        return null;
    } catch (error) {
        console.error("Cryptomail: Erro ao buscar chave:", error);
        recipientKeysCache.set(email, null);
        return null;
    }
}

/**
 * Lida com a injeção de elementos e eventos na janela de composição.
 * @param {HTMLElement} composeView - O elemento da janela de composição.
 */
function handleComposeWindow(composeView) {
    if (composeView.dataset.cryptomailHandled) return;
    composeView.dataset.cryptomailHandled = 'true';

    const toolbar = composeView.querySelector('.gU.Up');
    if (!toolbar) return;

    const encryptButton = document.createElement('div');
    encryptButton.className = 'cryptomail-encrypt-toggle';
    encryptButton.title = 'Criptografar esta mensagem';
    encryptButton.innerHTML = `
        <svg class="unlocked" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/></svg>
        <svg class="locked" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
    `;
    toolbar.prepend(encryptButton);

    encryptButton.addEventListener('click', async () => {
        if (!encryptButton.classList.contains('key-found')) {
            alert("Não é possível criptografar. Nenhuma chave pública encontrada para os destinatários.");
            return;
        }

        const messageBody = composeView.querySelector('div[aria-label="Corpo da mensagem"]');
        if (!messageBody) {
            alert("Não foi possível encontrar o corpo do e-mail para criptografar.");
            return;
        }

        const plainText = messageBody.innerText;
        if (!plainText) {
            alert("Não há texto para criptografar.");
            return;
        }

        const recipientPills = composeView.querySelectorAll('div[data-hovercard-id]');
        const emails = Array.from(recipientPills).map(pill => pill.getAttribute('data-hovercard-id'));
        
        const publicKeys = (await Promise.all(
            emails.map(email => findAndCacheKey(email))
        )).filter(Boolean);

        if (publicKeys.length === 0) {
            alert("Erro: as chaves dos destinatários não foram encontradas no cache. Tente novamente.");
            return;
        }

        try {
            const encryptedMessage = await openpgp.encrypt({
                message: await openpgp.createMessage({ text: plainText }),
                encryptionKeys: await Promise.all(publicKeys.map(armoredKey => openpgp.readKey({ armoredKey })))
            });
            
            messageBody.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${encryptedMessage}</pre>`;

        } catch (error) {
            console.error("Cryptomail: Erro durante a criptografia:", error);
            alert("Ocorreu um erro ao criptografar a mensagem.");
        }
    });

    const checkRecipientKeys = async () => {
        const recipientPills = composeView.querySelectorAll('div[data-hovercard-id]');
        const emails = Array.from(recipientPills).map(pill => pill.getAttribute('data-hovercard-id'));

        if (emails.length === 0) {
            encryptButton.classList.remove('key-found');
            return;
        }

        let atLeastOneKeyFound = false;
        for (const email of emails) {
            const publicKey = await findAndCacheKey(email);
            if (publicKey) {
                atLeastOneKeyFound = true;
                break;
            }
        }
        encryptButton.classList.toggle('key-found', atLeastOneKeyFound);
    };

    const recipientsContainer = composeView.querySelector('tbody.bze');
    if (recipientsContainer) {
        const recipientObserver = new MutationObserver(checkRecipientKeys);
        recipientObserver.observe(recipientsContainer, { childList: true, subtree: true });
        checkRecipientKeys();
    }
}

function injectMainIcon() {
    const targetNode = document.querySelector('.aic');
    if (!targetNode || document.querySelector('.cryptomail-compose-btn-container')) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'cryptomail-compose-btn-container';
    
    const iconButton = document.createElement('div');
    iconButton.className = 'cryptomail-compose-btn';
    iconButton.title = 'Abrir gerenciador de chaves do Cryptomail';
    
    const iconImage = document.createElement('img');
    iconImage.src = chrome.runtime.getURL('icons/icon48.png');
    
    iconButton.appendChild(iconImage);
    iconButton.addEventListener('click', () => chrome.runtime.sendMessage({ action: "openOptionsPage" }));
    
    buttonContainer.appendChild(iconButton);
    
    targetNode.appendChild(buttonContainer);
}

function injectCSS() {
    if (document.getElementById('cryptomail-styles')) return;
    const style = document.createElement('style');
    style.id = 'cryptomail-styles';
    style.textContent = `
        .cryptomail-compose-btn-container { display: flex; align-items: center; margin: 8px 0 16px; padding: 0 0 0 8px; }
        .cryptomail-compose-btn { width: 48px; height: 48px; border-radius: 50%; background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); cursor: pointer; display: flex; justify-content: center; align-items: center; transition: box-shadow 0.2s; }
        .cryptomail-compose-btn:hover { box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23); }
        .cryptomail-compose-btn img { width: 28px; height: 28px; }
        .cryptomail-encrypt-toggle { cursor: pointer; padding: 8px; border-radius: 50%; margin: 0 4px; display: flex; align-items: center; justify-content: center; }
        .cryptomail-encrypt-toggle:hover { background-color: #f1f3f4; }
        .cryptomail-encrypt-toggle .unlocked { display: block; color: #5f6368; }
        .cryptomail-encrypt-toggle .locked { display: none; color: #1e8e3e; }
        .cryptomail-encrypt-toggle.key-found .locked { display: block; }
        .cryptomail-encrypt-toggle.key-found .unlocked { display: none; }
    `;
    document.head.appendChild(style);
}

/**
 * Escaneia a página por mensagens PGP e injeta um botão de "Descriptografar".
 */
function scanAndHandleDecryptableMessages() {
    document.querySelectorAll('div.a3s').forEach(async (emailBody) => {
        if (emailBody.innerText.includes('-----BEGIN PGP MESSAGE-----') && !emailBody.dataset.cryptomailDecryptHandled) {
            emailBody.dataset.cryptomailDecryptHandled = 'true';

            const decryptButton = document.createElement('button');
            decryptButton.className = 'cryptomail-decrypt-btn';
            decryptButton.textContent = '🔓 Descriptografar com Cryptomail';
            
            decryptButton.addEventListener('click', async () => {
                const encryptedText = emailBody.innerText;
                const { userKeys } = await chrome.storage.local.get('userKeys');
                if (!userKeys || userKeys.length === 0) {
                    return alert("Nenhuma chave privada encontrada na sua extensão.");
                }

                let decrypted = false;
                for (let i = userKeys.length - 1; i >= 0; i--) {
                    const key = userKeys[i];
                    if (!key.privateKey) continue;

                    try {
                        let privateKeyObject = await openpgp.readPrivateKey({ armoredKey: key.privateKey });
                        if (!privateKeyObject) continue;

                        let isEncrypted = false;
                        if (privateKeyObject.isPrivate()) {
                            if (privateKeyObject.keyPacket?.s2k || privateKeyObject.subkeys?.some(sk => sk.keyPacket?.s2k)) {
                                isEncrypted = true;
                            }
                        }
                        let unlockedKey = privateKeyObject;
                        if (isEncrypted) {
                            const passphrase = prompt("Digite a senha da sua chave PGP para descriptografar:");
                            if (!passphrase) return;
                            
                            unlockedKey = await openpgp.decryptKey({ privateKey: privateKeyObject, passphrase });
                        }
                        
                        const message = await openpgp.readMessage({ armoredMessage: encryptedText });
                        
                        const { data: decryptedText } = await openpgp.decrypt({
                            message,
                            decryptionKeys: unlockedKey
                        });

                        emailBody.innerHTML = `<div style="font-family: sans-serif; white-space: pre-wrap; word-break: break-all;">${decryptedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
                        decrypted = true;
                        break;

                    } catch (e) {
                        console.log(`Cryptomail: Falha ao tentar descriptografar com a chave de ${key.email}.`, e);
                    }
                }

                if (!decrypted) {
                    alert("Falha na descriptografia. Verifique se a senha está correta (se pedida) ou se você possui a chave privada correspondente.");
                }
            });

            decryptButton.style.cssText = 'background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 14px; margin: 10px 0; display: block;';
            emailBody.prepend(decryptButton);
        }
    });
}


const observer = new MutationObserver(() => {
    injectMainIcon();
    injectCSS();
    scanAndHandleDecryptableMessages();

    document.querySelectorAll('div[role="dialog"]').forEach(dialog => {
        if (dialog.querySelector('.gU.Up')) {
            handleComposeWindow(dialog);
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});