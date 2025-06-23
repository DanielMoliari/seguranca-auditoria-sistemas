import { getAlgorithmInfo } from './crypto.js';

const views = {
    initialSetup: document.getElementById('initialSetup'),
    generateKeyForm: document.getElementById('generateKeyForm'),
    importKeyForm: document.getElementById('importKeyForm'),
    keyManagement: document.getElementById('keyManagement'),
    keyDetails: document.getElementById('keyDetails'),
};
const keyListDiv = document.getElementById('keyList');
const keyDetailsDiv = document.getElementById('keyDetails');
const notificationDiv = document.getElementById('notification');

export function showView(viewName) {
    Object.values(views).forEach(view => view.classList.add('hidden'));
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
    }
}

export function showNotification(message, type = 'success') {
    notificationDiv.textContent = message;
    notificationDiv.className = type;
    notificationDiv.classList.remove('hidden');
    setTimeout(() => notificationDiv.classList.add('hidden'), 5000);
}

export function renderKeyList(keys) {
    keyListDiv.innerHTML = '';
    if (keys.length === 0) {
        showView('initialSetup');
    } else {
        keys.forEach(key => {
            const keyEntry = document.createElement('div');
            keyEntry.className = 'key-entry';
            keyEntry.innerHTML = `
                <div class="key-info">
                    <span><strong>${key.name}</strong> &lt;${key.email}&gt;</span>
                    <span class="key-id">ID: ${key.keyID.substring(key.keyID.length - 16)}</span>
                </div>
                <div class="key-entry-actions">
                    <button class="icon-btn copy-public-key-btn" title="Copiar Chave Pública" data-key-id="${key.keyID}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg></button>
                    <button class="details-btn" data-key-id="${key.keyID}">Detalhes</button>
                </div>`;
            keyListDiv.appendChild(keyEntry);
        });
        showView('keyManagement');
    }
}

export async function renderKeyDetails(key) {
    try {
        const pgpKey = await openpgp.readKey({ armoredKey: key.publicKey });
        const keyName = key.name;
        const keyEmail = key.email;

        const creationTime = pgpKey.getCreationTime();
        const fingerprint = pgpKey.getFingerprint().toUpperCase().match(/.{1,4}/g).join(' ');
        const algorithmInfo = getAlgorithmInfo(pgpKey); 
        
        const detailsHTML = `
            <h2><a href="#" class="back-to-list-link">&larr; Voltar</a> ${keyName}</h2>
            <div class="details-actions">
                <button class="remove-key-btn" title="Remover esta chave">Remover</button>
                <button class="action-btn-disabled" title="Funcionalidade não implementada">Exportar</button>
            </div>
            <div class="detail-section">
                <h3>Assigned user IDs</h3>
                <div class="user-id-entry">
                    <span>${keyName} &lt;${keyEmail}&gt;</span>
                    <span class="status-valid">✔ valid</span>
                </div>
            </div>
            <div class="detail-section">
                <h3>Key details</h3>
                <div class="details-grid">
                    <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">valid</span></div>
                    <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${creationTime.toLocaleDateString()}</span></div>
                    <div class="detail-item"><span class="detail-label">Expires</span><span class="detail-value">never</span></div>
                    <div class="detail-item"><span class="detail-label">Key ID</span><span class="detail-value">${key.keyID}</span></div>
                    <div class="detail-item"><span class="detail-label">Algorithm</span><span class="detail-value">${algorithmInfo}</span></div>
                    <div class="detail-item fingerprint-item"><span class="detail-label">PGP Fingerprint</span><span class="detail-value">${fingerprint}</span></div>
                </div>
            </div>`;
        
        keyDetailsDiv.innerHTML = detailsHTML;
        showView('keyDetails');

    } catch (error) {
        console.error("Erro ao renderizar detalhes da chave:", error);
        showNotification("Não foi possível carregar os detalhes da chave.", "error");
    }
}