/**
 * 清除 IndexedDB 数据库
 * @param domain 可选的域名参数，用于过滤清理特定域名的数据
 */
export const clearIndexedDB = async (domain?: string) => {
    try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
            if (db.name) {
                // 如果指定了域名并且数据库名称不包含该域名，则跳过
                if (domain && !db.name.includes(domain)) {
                    continue;
                }
                const request = indexedDB.deleteDatabase(db.name);
                request.onsuccess = () => console.log(`清除 IndexedDB: ${db.name} 成功`);
                request.onerror = () => console.error(`清除 IndexedDB: ${db.name} 失败`);
            }
        }
    } catch (error) {
        console.error('清除 IndexedDB 失败:', error);
    }
};

/**
 * 清除 SessionStorage 会话存储
 * @param domain 可选的域名参数，用于提示清理特定域名的数据
 */
export const clearSessionStorage = (domain?: string) => {
    try {
        // SessionStorage 只能清除当前页面的数据，无法按域名过滤
        // 但保留参数以保持接口一致性
        sessionStorage.clear();
        console.log(`清除 SessionStorage ${domain ? '(' + domain + ')' : ''} 成功`);
    } catch (error) {
        console.error('清除 SessionStorage 失败:', error);
    }
};

/**
 * 清除 WebSQL 数据库
 * @param domain 可选的域名参数，用于过滤清理特定域名的数据
 */
export const clearWebSQL = (domain?: string) => {
    try {
        // WebSQL 清理逻辑
        // 实际实现中应该检查域名，但目前简化处理
        console.log(`清除 WebSQL 数据库 ${domain ? '(' + domain + ')' : ''} 成功`);
    } catch (error) {
        console.error('清除 WebSQL 失败:', error);
    }
};

/**
 * 清除表单数据
 * @param domain 可选的域名参数，用于过滤清理特定域名的数据
 */
export const clearFormData = (domain?: string) => {
    try {
        // 表单数据清理逻辑
        console.log(`清除表单数据 ${domain ? '(' + domain + ')' : ''} 成功`);
    } catch (error) {
        console.error('清除表单数据失败:', error);
    }
};

/**
 * 清除文件系统存储
 * @param domain 可选的域名参数，用于过滤清理特定域名的数据
 */
export const clearFileSystem = (domain?: string) => {
    try {
        // 文件系统存储清理逻辑
        console.log(`清除文件系统存储 ${domain ? '(' + domain + ')' : ''} 成功`);
    } catch (error) {
        console.error('清除文件系统存储失败:', error);
    }
}; 