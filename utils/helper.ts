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

export function getStoredStatus() {
    const statusStr = localStorage.getItem('status');
    if (!statusStr) {
        return null;
    }

    try {
        return JSON.parse(statusStr);
    } catch {
        return null;
    }
}

function formatDecimal(value, digits = 2) {
    if (!Number.isFinite(value)) {
        return '0';
    }

    if (Number.isInteger(value)) {
        return String(value);
    }

    return value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}

export function getPointsSettings(statusOverride = null) {
    const status = statusOverride || getStoredStatus();
    const ratio = Number(status?.points_per_cny);
    const pointsPerCny = Number.isFinite(ratio) && ratio > 0 ? ratio : 10;
    const pointsName =
        typeof status?.points_name === 'string' && status.points_name.trim()
            ? status.points_name.trim()
            : '积分';

    return {
        pointsPerCny,
        pointsName,
    };
}

export function formatPointsValue(value, pointsName = '积分', digits = 2) {
    return `${formatDecimal(Number(value), digits)} ${pointsName}`;
}

export function renderQuota(quota, digits = 2, options = {}) {
    const status = getStoredStatus();
    const { preferPoints = false } = options;
    let quotaPerUnit = status?.quota_per_unit;
    const quotaDisplayType = status?.quota_display_type || 'USD';
    quotaPerUnit = parseFloat(quotaPerUnit);
    const { pointsName, pointsPerCny } = getPointsSettings(status);
    const usdRate = Number(status?.usd_exchange_rate || 1);

    if (quotaDisplayType === 'TOKENS' && !preferPoints) {
        return renderNumber(quota);
    }

    if (quotaDisplayType === 'POINTS' && !preferPoints) {
        return formatPointsValue(quota, pointsName, digits);
    }

    if (!Number.isFinite(quotaPerUnit) || quotaPerUnit <= 0) {
        if (preferPoints) {
            return formatPointsValue(quota, pointsName, digits);
        }
        return quota;
    }

    const resultUSD = quota / quotaPerUnit;
    const resultCny = resultUSD * (Number.isFinite(usdRate) && usdRate > 0 ? usdRate : 1);

    if (preferPoints) {
        return formatPointsValue(resultCny * pointsPerCny, pointsName, digits);
    }

    let symbol = '$';
    let value = resultUSD;
    if (quotaDisplayType === 'CNY') {
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
