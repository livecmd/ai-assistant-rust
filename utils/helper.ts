export function renderNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 10000) {
        return (num / 1000).toFixed(1) + 'k';
    } else {
        return num;
    }
}

export function renderQuota(quota, digits = 2) {
    const statusStr = localStorage.getItem('status');
    let status
    try {
        status = JSON.parse(statusStr);
    } catch (e) {
        throw (e);
    }
    let quotaPerUnit = status?.quota_per_unit;
    const quotaDisplayType = status?.quota_display_type || 'USD';
    quotaPerUnit = parseFloat(quotaPerUnit);
    if (quotaDisplayType === 'TOKENS') {
        return renderNumber(quota);
    }
    const resultUSD = quota / quotaPerUnit;
    let symbol = '$';
    let value = resultUSD;
    if (quotaDisplayType === 'CNY') {
        const usdRate = status?.usd_exchange_rate || 1;
        value = resultUSD * usdRate;
        symbol = '¥';
    } else if (quotaDisplayType === 'CUSTOM') {
        const statusStr = localStorage.getItem('status');
        let symbolCustom = '¤';
        let rate = 1;
        symbolCustom = status?.custom_currency_symbol || symbolCustom;
        rate = status?.custom_currency_exchange_rate || rate;
        value = resultUSD * rate;
        symbol = symbolCustom;
    }
    const fixedResult = value.toFixed(digits);
    if (parseFloat(fixedResult) === 0 && quota > 0 && value > 0) {
        const minValue = Math.pow(10, -digits);
        return symbol + minValue.toFixed(digits);
    }
    return symbol + fixedResult;
}

// 定义参数接口
interface QueryParams {
    [key: string]: string | number | boolean | undefined | null;
}

export function jsonToQueryString(params: QueryParams): string {
    // 过滤掉 undefined 或 null 的值 (可选，视需求而定)
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
            acc[key] = String(value); // URLSearchParams 需要 string 类型的值
        }
        return acc;
    }, {} as Record<string, string>);

    return new URLSearchParams(cleanParams).toString();
}