import { useEffect, useMemo, useState } from "react";
import {
	getPublicModelConfigsApi,
	getPublicModelPricesApi,
	PublicModelConfig,
	PublicModelPrice,
} from "@/api";

type CatalogOptions = {
	category?: string;
	provider?: string;
};

function formatPriceValue(price: number): string {
	if (Number.isInteger(price)) {
		return String(price);
	}
	return price.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function useModelCatalog(options: CatalogOptions) {
	const [configs, setConfigs] = useState<PublicModelConfig[]>([]);
	const [prices, setPrices] = useState<PublicModelPrice[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			const [configRes, priceRes] = await Promise.all([
				getPublicModelConfigsApi({ category: options.category, provider: options.provider }),
				getPublicModelPricesApi({ provider: options.provider }),
			]);
			if (cancelled) {
				return;
			}
			if (configRes.success && Array.isArray(configRes.data)) {
				setConfigs(configRes.data);
			}
			if (priceRes.success && Array.isArray(priceRes.data)) {
				setPrices(priceRes.data);
			}
			setLoading(false);
		};
		load().catch(() => {
			if (!cancelled) {
				setLoading(false);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [options.category, options.provider]);

	const configMap = useMemo(() => {
		const map = new Map<string, PublicModelConfig>();
		configs.forEach((item) => map.set(item.model_key, item));
		return map;
	}, [configs]);

	const pricesByKey = useMemo(() => {
		const map = new Map<string, PublicModelPrice[]>();
		prices.forEach((item) => {
			const list = map.get(item.model_key) || [];
			list.push(item);
			map.set(item.model_key, list);
		});
		return map;
	}, [prices]);

	const formatPriceSummary = (modelKeys: string[]) => {
		const parts = modelKeys.flatMap((key) => {
			const entries = pricesByKey.get(key) || [];
			return entries.map((entry) => {
				const priceText = `${entry.currency === "CNY" ? "¥" : `${entry.currency} `}${formatPriceValue(entry.price)}/${entry.unit}`;
				if (entry.display_name && entry.display_name !== entry.model_key) {
					return `${entry.display_name} ${priceText}`;
				}
				return priceText;
			});
		});
		return parts.join(" · ");
	};

	return {
		configs,
		prices,
		loading,
		getConfig: (modelKey: string) => configMap.get(modelKey),
		getPrices: (modelKey: string) => pricesByKey.get(modelKey) || [],
		formatPriceSummary,
	};
}