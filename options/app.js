
import * as storage from './storage.js';
import * as ui from './ui.js';
import * as api from './api.js';

const state = {
    keys: [],
};


async function loadInitialData() {
    state.keys = await storage.getKeys();
    ui.renderKeyList(state.keys);
    bindKeyListEvents();
}

/**
 * Força o download de um conteúdo de texto como um arquivo.
 * @param {string} filename - O nome do arquivo a ser salvo.
 * @param {string} content - O conteúdo do arquivo.
 */
function downloadAsFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

async function handleGenerateKey() {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const reenterPasswordInput = document.getElementById('reenterPassword');
    const uploadKeyCheckbox = document.getElementById('uploadKey');

    if (passwordInput.value !== reenterPasswordInput.value) {
        ui.showNotification("As senhas não coincidem!", 'error');
        return;
    }
    if (passwordInput.value.length < 8) {
        ui.showNotification("A senha deve ter pelo menos 8 caracteres.", 'error');
        return;
    }

    ui.showNotification("Gerando chaves... Isso pode levar um momento.", 'success');
    document.getElementById('generateBtn').disabled = true;

    try {
        const { privateKey, publicKey } = await openpgp.generateKey({
            type: 'rsa',
            rsaBits: 4096,
            userIDs: [{ name: nameInput.value, email: emailInput.value }],
            passphrase: passwordInput.value,
        });


        const keyObj = await openpgp.readKey({ armoredKey: publicKey });
        const keyID = keyObj.getKeyIDs()[0].toHex().toUpperCase();
        
        const newKeyData = {
            name: nameInput.value,
            email: emailInput.value,
            keyID: keyID,
            publicKey: publicKey,
            privateKey: privateKey,
        };

        const currentKeys = await storage.getKeys();
        currentKeys.push(newKeyData);
        await storage.saveKeys(currentKeys);

        ui.showNotification("Chaves geradas e salvas com sucesso!", 'success');

        if (uploadKeyCheckbox.checked) {
            const apiResult = await api.uploadKey(publicKey);
            ui.showNotification(apiResult.message, apiResult.success ? 'success' : 'error');

            if (apiResult.success && apiResult.response) {
                const token = apiResult.response.token;

                const statusObj = apiResult.response.status;
                const email = Object.keys(statusObj)[0];

                const apiResult2 = await api.requestConfirmationKey(token, email);
                ui.showNotification(apiResult2.message, apiResult2.success ? 'success' : 'error');
            }
        }
        
        nameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        reenterPasswordInput.value = '';
        await loadInitialData();

    } catch (error) {
        console.error("Erro ao gerar chaves:", error);
        ui.showNotification(`Falha ao gerar chaves: ${error.message}`, 'error');
    } finally {
        document.getElementById('generateBtn').disabled = false;
    }
}

function sanitizeArmoredKey(armoredText) {
    const lines = armoredText.split('\n');
    const headerEndIndex = lines.findIndex(line => line.trim() === '');
    if (headerEndIndex > 1) {
        const beginLine = lines[0];
        const keyBody = lines.slice(headerEndIndex);
        return [beginLine, ...keyBody].join('\n');
    }
    return armoredText;
}

async function handleImportKey() {
    const keyTextInput = document.getElementById('keyToImport');
    const keyText = keyTextInput.value.trim();
    const importBtn = document.getElementById('importBtn');

    if (!keyText) {
        return ui.showNotification("Por favor, cole o texto da chave.", "error");
    }

    try {
        ui.showNotification("Processando chave...", "success");
        importBtn.disabled = true;

        const sanitizedKeyText = sanitizeArmoredKey(keyText);
        let key = await openpgp.readKey({ armoredKey: sanitizedKeyText });

        if (!key) {
            throw new Error("A chave fornecida não pôde ser lida ou tem um formato inválido.");
        }

        let isEncrypted = false;
        if (key.isPrivate()) {
            if (key.keyPacket?.s2k || key.subkeys?.some(sk => sk.keyPacket?.s2k)) {
                isEncrypted = true;
            }
        }

        if (isEncrypted) {
            const passphrase = prompt("Esta chave privada está protegida por senha. Por favor, digite a senha para importá-la:");
            if (!passphrase) {
                importBtn.disabled = false;
                return ui.showNotification("Importação cancelada. Senha não fornecida.", "error");
            }
            try {
                key = await openpgp.decryptKey({ privateKey: key, passphrase });
            } catch (e) {
                importBtn.disabled = false;
                return ui.showNotification("Senha incorreta. A chave privada não pôde ser importada.", "error");
            }
        }
        
        const keyID = key.getKeyIDs()[0].toHex().toUpperCase();
        const currentKeys = await storage.getKeys();
        if (currentKeys.some(k => k.keyID === keyID)) {
            importBtn.disabled = false;
            return ui.showNotification("Esta chave já existe no seu chaveiro.", "error");
        }
        
        const userIDsArray = key.getUserIDs();
        let name = 'Nome não encontrado';
        let email = 'Email não encontrado';

        if (userIDsArray && userIDsArray.length > 0) {
            const userIDString = userIDsArray[0];
            const match = userIDString.match(/(.*)<(.*)>/);
            if (match && match.length === 3) {
                name = match[1].trim();
                email = match[2].trim();
            } else {
                name = userIDString;
            }
        }

        const publicKeyObject = key.toPublic();
        const publicKeyArmored = await publicKeyObject.export();
        
        const privateKeyArmored = key.isPrivate() ? await key.export() : null;

        const newKeyData = {
            name, email, keyID,
            publicKey: publicKeyArmored,
            privateKey: privateKeyArmored
        };

        currentKeys.push(newKeyData);
        await storage.saveKeys(currentKeys);

        ui.showNotification(`Chave para '${name}' importada com sucesso!`, "success");
        keyTextInput.value = '';
        await loadInitialData();

    } catch (error) {
        console.error("Erro ao importar chave:", error);
        ui.showNotification(error.message || "Formato de chave inválido.", "error");
    } finally {
        importBtn.disabled = false;
    }
}

async function handleRemoveKey(keyIDToRemove) {
    if (!confirm("Tem certeza de que deseja remover esta chave? Esta ação não pode ser desfeita.")) {
        return;
    }

    const updatedKeys = state.keys.filter(key => key.keyID !== keyIDToRemove);

    await storage.saveKeys(updatedKeys);
    
    ui.showNotification("Chave removida com sucesso.", "success");

    await loadInitialData();
}


function bindKeyListEvents() {
    document.querySelectorAll('.copy-public-key-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const keyID = e.currentTarget.dataset.keyId;
            const keyToCopy = state.keys.find(k => k.keyID === keyID);
            if (keyToCopy) {
                navigator.clipboard.writeText(keyToCopy.publicKey);
                ui.showNotification('Chave pública copiada!', 'success');
            }
        });
    });

    document.querySelectorAll('.details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const keyID = e.currentTarget.dataset.keyId;
            const keyToShow = state.keys.find(k => k.keyID === keyID);
            if (keyToShow) {
                ui.renderKeyDetails(keyToShow).then(() => {
                    document.querySelector('#keyDetails .back-to-list-link').addEventListener('click', (ev) => {
                        ev.preventDefault();
                        loadInitialData();
                    });

                    const removeBtn = document.querySelector('#keyDetails .remove-key-btn');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            handleRemoveKey(keyID); 
                        });
                    }
                });
            }
        });
    });
}

function bindStaticEvents() {
    document.getElementById('showGenerateFormBtn').addEventListener('click', () => ui.showView('generateKeyForm'));
    document.getElementById('addNewKeyBtn').addEventListener('click', () => ui.showView('generateKeyForm'));
    document.getElementById('showImportFormBtn').addEventListener('click', () => ui.showView('importKeyForm'));
    document.getElementById('importNewKeyBtn').addEventListener('click', () => ui.showView('importKeyForm'));
    document.getElementById('generateBtn').addEventListener('click', handleGenerateKey);
    document.getElementById('importBtn').addEventListener('click', handleImportKey);

    document.querySelectorAll('.back-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadInitialData();
        });
    });
}

export function init() {
    bindStaticEvents();
    loadInitialData();
}