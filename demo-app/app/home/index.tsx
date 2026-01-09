import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
	Heart,
	Home as HomeIcon,
	MapPin,
	MessageCircle,
	Plus,
	Radar,
	Search,
	User,
	Users,
	Wallet,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
	FlatList,
	Image,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import Animated, {
	FadeIn,
	FadeInDown,
	FadeInUp,
	LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	CategoryResponse,
	ItemResponse,
	addFavorite,
	getCategories,
	getItems,
	getMe,
	getPointsBalance,
	removeFavorite,
} from "../../utils/api";

const fallbackImage = "https://via.placeholder.com/900?text=Give+%26+Take";
const ITEMS_LIMIT = 50;

const pastelPalette = ["#7DD3CE", "#FFB6C1", "#FFD97D", "#A8E6E2", "#FFD4DC", "#FFE8B3"];

const typeLabel = (type?: string) => {
	if (type === "EXCHANGE") return "Trao đổi";
	return "Cho tặng";
};

const typeColor = (type?: string) => (type === "EXCHANGE" ? "#FFB6C1" : "#7DD3CE");

const formatDate = (value?: string) => {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("vi-VN");
};

const getCategoryColor = (category: Partial<CategoryResponse>, index: number) =>
	category.color || pastelPalette[index % pastelPalette.length];

export default function HomeScreen() {
	const router = useRouter();
	const [userName, setUserName] = useState<string>("Bạn");
	const [points, setPoints] = useState<number>(0);
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [search, setSearch] = useState("");
	const [items, setItems] = useState<ItemResponse[]>([]);
	const [categories, setCategories] = useState<CategoryResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [favoritingIds, setFavoritingIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		const loadUser = async () => {
			const stored = await AsyncStorage.getItem("userName");
			if (stored) setUserName(stored);
		};

		const loadCategories = async () => {
			try {
				const data = await getCategories();
				setCategories(data);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Không thể tải danh mục";
				setError(message);
			}
		};

		const loadPoints = async () => {
			try {
				const me = await getMe();
				const nextFromMe = Number((me as any)?.gPoints ?? 0);
				setPoints(Number.isFinite(nextFromMe) ? nextFromMe : 0);
				if (me?.name) {
					setUserName(me.name);
					AsyncStorage.setItem("userName", me.name).catch(() => null);
				}
			} catch (err) {
				try {
					const data = await getPointsBalance();
					const next = typeof data === "number" ? data : (data as any)?.balance ?? 0;
					setPoints(Number.isFinite(next) ? next : 0);
				} catch (fallbackErr) {
					console.log("Failed to load points", fallbackErr);
				}
			}
		};

		loadUser();
		loadCategories();
		loadPoints();
	}, []);

	const fetchItems = useCallback(async (isRefresh = false) => {
		setError(null);
		if (isRefresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}

		try {
			const res = await getItems({
				search: search.trim() || undefined,
				category: selectedCategory !== "all" ? selectedCategory : undefined,
				limit: ITEMS_LIMIT,
			});
			const filtered = (res.items || []).filter((it) => {
				const st = (it.status || "").toUpperCase();
				return st === "AVAILABLE" || st === "PENDING" || st === "";
			});
			setItems(filtered);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Không thể tải danh sách";
			setError(message);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [search, selectedCategory]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			fetchItems();
		}, 350);
		return () => clearTimeout(timeout);
	}, [fetchItems]);

	const onRefresh = () => fetchItems(true);

	const renderCard = ({ item, index }: { item: ItemResponse; index: number }) => {
		const cover = item.images?.[0] || fallbackImage;
		const badge = typeColor(item.type);
		const ownerName = item.owner?.name || "Ẩn danh";
		const timeText = formatDate(item.createdAt) || "Vừa cập nhật";
		const location = item.location || "Chưa cập nhật";
		const isFavorited = Boolean((item as any)?.isFavorited);
		const isBusy = favoritingIds.has(item.id);

		const toggleFavorite = async () => {
			const current = Boolean((item as any)?.isFavorited);
			setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, isFavorited: !current } : p)));
			setFavoritingIds((prev) => new Set(prev).add(item.id));
			try {
				if (current) {
					await removeFavorite(item.id);
				} else {
					await addFavorite(item.id);
				}
			} catch (err) {
				setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, isFavorited: current } : p)));
				console.log("Favorite toggle failed", err);
			} finally {
				setFavoritingIds((prev) => {
					const next = new Set(prev);
					next.delete(item.id);
					return next;
				});
			}
		};

		return (
			<Animated.View
				entering={FadeInDown.delay(index * 50).springify().damping(18)}
				layout={LinearTransition.springify().damping(18)}
			>
				<Pressable
					className="bg-white rounded-2xl overflow-hidden"
					onPress={() => router.push({ pathname: "/item", params: { id: item.id } })}
					style={({ pressed }) => [styles.cardShadow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
				>
					<View className="relative">
						<Image
							source={{ uri: cover }}
							className="w-full aspect-square"
							resizeMode="cover"
						/>
						<Pressable
							onPress={toggleFavorite}
							className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 items-center justify-center"
							style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}
							disabled={isBusy}
						>
							<Heart
								size={16}
								color={isFavorited ? "#F472B6" : "#4B5563"}
								fill={isFavorited ? "#F472B6" : "none"}
								opacity={isBusy ? 0.5 : 1}
							/>
						</Pressable>
						<View
							className="absolute top-2 left-2 px-3 py-1 rounded-full"
							style={{ backgroundColor: badge, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
						>
							<Text className="text-white text-xs font-semibold">{typeLabel(item.type)}</Text>
						</View>
					</View>
					<View className="p-3 gap-2">
						<Text className="font-semibold text-sm text-gray-900" numberOfLines={2}>
							{item.title}
						</Text>
						<View className="flex-row items-center gap-1">
							<View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#7DD3CE" }} />
							<MapPin size={12} color="#6B7280" />
							<Text className="text-xs text-gray-500" numberOfLines={1}>
								{location}
							</Text>
						</View>
						<View className="flex-row items-center justify-between mt-1">
							<Text className="text-xs text-gray-500">{timeText}</Text>
							<View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: "#7DD3CE" }}>
								<Text className="text-white text-xs font-semibold">
									{ownerName.charAt(0)}
								</Text>
							</View>
						</View>
					</View>
				</Pressable>
			</Animated.View>
		);
	};

	const renderSkeleton = (index: number) => (
		<Animated.View
			key={`skeleton-${index}`}
			entering={FadeInDown.delay(index * 60).springify().damping(18)}
			className="bg-white rounded-2xl overflow-hidden"
			style={[styles.cardShadow, { width: "48%", aspectRatio: 1 }]}
		>
			<View className="bg-gray-200/70 flex-1" />
			<View className="p-3 gap-3">
				<View className="h-3.5 bg-gray-200/70 rounded-full w-4/5" />
				<View className="flex-row items-center gap-2">
					<View className="w-3 h-3 bg-gray-200/70 rounded-full" />
					<View className="h-3 bg-gray-200/70 rounded-full w-3/5" />
				</View>
				<View className="flex-row items-center justify-between">
					<View className="h-3 bg-gray-200/70 rounded-full w-1/3" />
					<View className="w-6 h-6 rounded-full bg-gray-200/70" />
				</View>
			</View>
		</Animated.View>
	);

	return (
		<SafeAreaView className="flex-1 bg-[#F8FAFC]">
			<ScrollView
				contentContainerStyle={{ paddingBottom: 140 }}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#7DD3CE"]} />
				}
				showsVerticalScrollIndicator={false}
			>
				<Animated.View
					entering={FadeInDown.springify().damping(18)}
					className="bg-white px-6 pt-8 pb-6 rounded-b-3xl shadow-sm border-b border-gray-100"
				>
					<View className="flex-row items-start justify-between mb-5">
						<View className="gap-1 flex-1 pr-4">
							<Text className="text-sm text-gray-400">Xin chào,</Text>
							<Text className="text-2xl font-black text-gray-900">{userName}! 👋</Text>
							<Text className="text-sm text-gray-500">Hãy tìm món đồ bạn cần hôm nay</Text>
						</View>
						<View className="items-end gap-2">
							<Pressable
								className="px-3 py-2 rounded-full"
								style={{ backgroundColor: "#FFE7A3", shadowColor: "#F5BF38", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}
								onPress={() => router.push("/points")}
							>
								<View className="flex-row items-center gap-2">
									<View className="w-8 h-8 rounded-full bg-white/80 items-center justify-center">
										<Wallet size={18} color="#D88B00" />
									</View>
									<View>
										<Text className="text-[10px] font-semibold text-[#7D5A00]">G-Point</Text>
										<Text className="text-base font-bold text-[#D88B00]">{points}</Text>
									</View>
								</View>
							</Pressable>
							<Pressable
								className="w-11 h-11 rounded-full bg-[#7DD3CE] items-center justify-center"
								onPress={() => router.push("/profile")}
								style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }], shadowColor: "#7DD3CE", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } })}
							>
								<Text className="text-white font-semibold text-lg">
									{userName.charAt(0).toUpperCase()}
								</Text>
							</Pressable>
						</View>
					</View>

					<Animated.View entering={FadeInUp.delay(80).springify().damping(18)} className="relative">
						<View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
							<Search size={20} color="#9CA3AF" />
							<TextInput
								placeholder="Tìm kiếm đồ cũ..."
								value={search}
								onChangeText={setSearch}
								className="flex-1 ml-3 text-base"
								placeholderTextColor="#9CA3AF"
							/>
							<Pressable
								className="w-10 h-10 rounded-full items-center justify-center bg-[#7DD3CE]"
								onPress={() => router.push("/wishlist")}
							>
								<Radar size={18} color="#fff" />
							</Pressable>
						</View>
					</Animated.View>

					<Animated.View entering={FadeInUp.delay(150).springify().damping(18)} className="mt-4">
						<Pressable
							className="flex-row items-center justify-center py-3 rounded-full bg-[#FFE5EC]"
							onPress={() => router.push("/public-wishlist")}
						>
							<Users size={16} color="#FF8FA3" />
							<Text className="text-xs font-semibold text-[#FF8FA3] ml-2">
								Mong muốn cộng đồng
							</Text>
						</Pressable>
					</Animated.View>
				</Animated.View>

				<Animated.View entering={FadeInDown.delay(200).springify().damping(18)} className="px-6 py-4">
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ gap: 10 }}
					>
						{[{ id: "all", name: "Tất cả", color: "#7DD3CE" }, ...categories].map((cat, index) => {
							const active = selectedCategory === cat.id;
							const tint = getCategoryColor(cat, index);
							return (
								<Animated.View key={cat.id} entering={FadeIn.delay(250 + index * 40).springify()}>
									<Pressable
										onPress={() => setSelectedCategory(cat.id)}
										className="px-4 py-2 rounded-full"
										style={{
											backgroundColor: active ? tint : "#FFFFFF",
											borderColor: active ? tint : "#E5E7EB",
											borderWidth: active ? 0 : 1,
											shadowColor: active ? tint : "transparent",
											shadowOpacity: active ? 0.25 : 0,
											shadowRadius: active ? 8 : 0,
											shadowOffset: active ? { width: 0, height: 4 } : undefined,
											elevation: active ? 3 : 0,
										}}
									>
										<Text className="text-sm font-semibold" style={{ color: active ? "#fff" : "#374151" }}>
											{cat.name}
										</Text>
									</Pressable>
								</Animated.View>
							);
						})}
					</ScrollView>
				</Animated.View>

				<View className="px-6">
					{error && <Text className="text-red-500 text-sm mb-2">{error}</Text>}

					{loading ? (
						<View className="py-2">
							<View className="flex-row flex-wrap justify-between gap-y-4">
								{Array.from({ length: 6 }).map((_, i) => renderSkeleton(i))}
							</View>
						</View>
					) : (
						<FlatList
							data={items}
							keyExtractor={(item) => item.id}
							numColumns={2}
							columnWrapperStyle={{ gap: 14 }}
							renderItem={renderCard}
							ItemSeparatorComponent={() => <View className="h-4" />}
							scrollEnabled={false}
							ListEmptyComponent={
								<View className="py-10 items-center">
									<Text className="text-gray-500">Chưa có món nào phù hợp.</Text>
								</View>
							}
						/>
					)}
				</View>
			</ScrollView>

			<Animated.View
				entering={FadeInUp.delay(120).springify().damping(18)}
				className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3"
			>
				<View className="flex-row items-center justify-around">
					<Pressable className="items-center gap-1">
						<HomeIcon size={24} color="#7DD3CE" />
						<Text className="text-xs font-semibold text-[#7DD3CE]">Trang chủ</Text>
					</Pressable>
					<Pressable className="items-center gap-1" onPress={() => router.push("/search") }>
						<Search size={24} color="#9CA3AF" />
						<Text className="text-xs text-gray-500">Tìm kiếm</Text>
					</Pressable>
					<Pressable className="items-center gap-1 -mt-6" onPress={() => router.push("/add") }>
						<View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: "#7DD3CE", shadowColor: "#7DD3CE", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
							<Plus size={28} color="#fff" />
						</View>
					</Pressable>
					<Pressable className="items-center gap-1" onPress={() => router.push("/chat") }>
						<MessageCircle size={24} color="#9CA3AF" />
						<Text className="text-xs text-gray-500">Tin nhắn</Text>
					</Pressable>
					<Pressable className="items-center gap-1" onPress={() => router.push("/profile") }>
						<User size={24} color="#9CA3AF" />
						<Text className="text-xs text-gray-500">Cá nhân</Text>
					</Pressable>
				</View>
			</Animated.View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	cardShadow: {
		shadowColor: "#000",
		shadowOpacity: 0.12,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
	},
});
