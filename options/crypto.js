
/**
 * Extrai informações legíveis do algoritmo de uma chave PGP.
 * @param {object} pgpKey - O objeto da chave parseado pelo openpgp.js.
 * @returns {string} Uma string descrevendo o algoritmo.
 */
export function getAlgorithmInfo(pgpKey) {
    try {
        const algo = pgpKey.getAlgorithmInfo();
        if (!algo) return "Indisponível";
        let algoName = algo.algorithm.toUpperCase();
        if (['ECDH', 'ECDSA'].includes(algoName)) algoName = 'ECC';
        return `${algoName} (${algo.bits || algo.curve})`;
    } catch (error) {
        console.error("Erro em getAlgorithmInfo:", error);
        return "Erro";
    }
}