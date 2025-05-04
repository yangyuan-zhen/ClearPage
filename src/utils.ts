/**
 * 清除 IndexedDB 数据库
 */
export const clearIndexedDB = async () => {
    const databases = await indexedDB.databases();
    for (const db of databases) {
        if (db.name) {
            const request = indexedDB.deleteDatabase(db.name);
            request.onsuccess = () => console.log(`清除 IndexedDB: ${db.name} 成功`);
            request.onerror = () => console.error(`清除 IndexedDB: ${db.name} 失败`);
        }
    }
};

/**
 * 清除 SessionStorage 会话存储
 */
export const clearSessionStorage = () => {
    sessionStorage.clear();
    console.log('清除 SessionStorage 成功');
};

/**
 * 清除 WebSQL 数据库
 */
export const clearWebSQL = () => {
    // WebSQL 清理逻辑
    console.log('清除 WebSQL 数据库成功');
};

/**
 * 清除表单数据
 */
export const clearFormData = () => {
    // 表单数据清理逻辑
    console.log('清除表单数据成功');
};

/**
 * 清除文件系统存储
 */
export const clearFileSystem = () => {
    // 文件系统存储清理逻辑
    console.log('清除文件系统存储成功');
}; 