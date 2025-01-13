export const getMessage = (key: string, substitutions?: string | string[]) => {
    return chrome.i18n.getMessage(key, substitutions);
}; 