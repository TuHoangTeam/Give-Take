import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ArrowLeft, FileText, MapPin, Package, Upload, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAppContext } from "../../contexts/AppContext";
import { CategoryResponse, createItem, getCategories, getPointsBalance } from "../../utils/api";

const typeOptions = [
  { label: "Cho tặng", value: "GIVE" },
  { label: "Trao đổi", value: "EXCHANGE" },
];
const conditions = [
  { label: "Mới", value: "NEW" },
  { label: "Khá mới", value: "LIKE_NEW" },
  { label: "Còn tốt", value: "GOOD" },
  { label: "Khá cũ", value: "FAIR" },
  { label: "Cần sửa chữa", value: "POOR" },
];

const co2Lookup: Record<string, number> = {
  "Nội thất": 3.5,
  "Sách": 0.5,
  "Quần áo": 2,
  "Đồ điện tử": 5,
  "Đồ gia dụng": 1.5,
  "Phương tiện": 10,
  "Khác": 1,
};

export default function AddItemScreen() {
  const router = useRouter();
  const { addGPoints, addEcoImpact } = useAppContext();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<{ uri: string; fileName?: string; mimeType?: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    condition: "",
    location: "",
  });

  const update = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === form.category),
    [categories, form.category]
  );
  const co2Estimate = selectedCategory ? co2Lookup[selectedCategory.name] || 1 : 1;

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const [categoriesRes, pointsRes] = await Promise.all([getCategories(), getPointsBalance()]);
        setCategories(categoriesRes);
        const balance = typeof pointsRes === "number" ? pointsRes : (pointsRes as any)?.balance;
        if (Number.isFinite(balance)) setPoints(Number(balance));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải danh mục";
        setError(message);
      } finally {
        setLoadingCategories(false);
        setLoadingPoints(false);
      }
    };
    load();
  }, []);

  const categoryChips = useMemo(() => {
    if (loadingCategories) return Array.from({ length: 7 }).map((_, i) => ({ id: `skeleton-${i}`, name: "" } as CategoryResponse));
    return categories;
  }, [categories, loadingCategories]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền truy cập", "Cần cấp quyền truy cập thư viện ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName || `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
      }));
      setImages((prev) => [...prev, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Vui lòng nhập tiêu đề";
    if (!form.description.trim()) return "Vui lòng nhập mô tả";
    if (!form.category) return "Vui lòng chọn danh mục";
    if (!form.type) return "Vui lòng chọn hình thức";
    if (!form.condition) return "Vui lòng chọn tình trạng";
    if (!form.location.trim()) return "Vui lòng nhập vị trí";
    return "";
  };

  const submit = async () => {
    const message = validateForm();
    if (message) {
      Alert.alert("Thông báo", message);
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    fd.append("categoryId", form.category);
    fd.append("type", form.type);
    fd.append("condition", form.condition);
    fd.append("location", form.location.trim());
    fd.append("estimatedCO2", String(co2Estimate));
    fd.append("latitude", "10.762622");
    fd.append("longitude", "106.660172");

    images.forEach((img) => {
      fd.append("images", {
        uri: img.uri,
        name: img.fileName || "image.jpg",
        type: img.mimeType || "image/jpeg",
      } as any);
    });

    setSubmitting(true);
    try {
      await createItem(fd);
      addGPoints(10, `Đăng món đồ: ${form.title}`);
      addEcoImpact(co2Estimate, co2Estimate * 0.8);
      Alert.alert("Thành công", "Đăng tin thành công!", [
        { text: "OK", onPress: () => router.back() },
      ]);
      setForm({ title: "", description: "", category: "", type: "", condition: "", location: "" });
      setImages([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng tin thất bại";
      Alert.alert("Lỗi", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 py-4 border-b">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#111" />
        </Pressable>
        <Text className="text-lg font-semibold">Đăng món đồ</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="px-6 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: "#F0FBF8", borderColor: "#CFF3E8", borderWidth: 1 }}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold text-gray-600">Bạn đang có</Text>
              <View className="flex-row items-end gap-2 mt-1">
                {loadingPoints ? (
                  <ActivityIndicator color="#34C759" />
                ) : (
                  <Text className="text-3xl font-bold text-[#2EB872]">{points ?? "-"}</Text>
                )}
                <Text className="text-sm font-semibold text-gray-700">G-Point</Text>
              </View>
            </View>
            <View className="px-3 py-2 rounded-full" style={{ backgroundColor: "#E0F8EF" }}>
              <Text className="text-xs font-semibold text-[#2EB872]">Đổi đồ xanh</Text>
            </View>
          </View>
        </View>

        {/* Image Upload */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Upload size={16} color="#7DD3CE" />
            <Text className="text-sm font-semibold text-gray-700">Hình ảnh (tối đa 5 ảnh)</Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {images.map((image, index) => (
              <View key={index} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                <Image source={{ uri: image.uri }} className="w-full h-full" resizeMode="cover" />
                <Pressable
                  onPress={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
                >
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            {images.length < 5 && (
              <Pressable
                onPress={pickImages}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center gap-1"
              >
                <Upload size={20} color="#9CA3AF" />
                <Text className="text-xs text-gray-500">Thêm ảnh</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Title */}
        <View className="mb-5">
          <View className="flex-row items-center gap-2 mb-2">
            <FileText size={16} color="#7DD3CE" />
            <Text className="text-sm text-gray-700">Tiêu đề</Text>
          </View>
          <TextInput
            placeholder="VD: Ghế sofa vintage màu xanh"
            value={form.title}
            onChangeText={(v) => update("title", v)}
            className="h-12 rounded-xl bg-gray-50 px-4 text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Description */}
        <View className="mb-5">
          <View className="flex-row items-center gap-2 mb-2">
            <Package size={16} color="#7DD3CE" />
            <Text className="text-sm text-gray-700">Mô tả chi tiết</Text>
          </View>
          <TextInput
            multiline
            numberOfLines={4}
            placeholder="Mô tả tình trạng, lý do cho đi, cách sử dụng..."
            value={form.description}
            onChangeText={(v) => update("description", v)}
            className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 min-h-32"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View className="mb-5">
          <Text className="mb-3 text-sm font-semibold text-gray-900">Danh mục</Text>
          <View className="flex-row flex-wrap gap-2">
            {categoryChips.map((c) => {
              const isSelected = form.category === c.id;
              return (
                <Pressable
                  key={c.id}
                  disabled={!c.id}
                  onPress={() => update("category", c.id || "")}
                  className={`px-4 py-2.5 rounded-full ${
                    isSelected ? "bg-[#7DD3CE]" : "bg-gray-100"
                  } ${!c.id ? "opacity-50" : ""}`}
                >
                  <Text className={`text-sm ${isSelected ? "text-white font-medium" : "text-gray-700"}`}>
                    {c.name || "..."}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {error && <Text className="text-xs text-red-500 mt-2">{error}</Text>}
        </View>

        {/* Type */}
        <View className="mb-5">
          <Text className="mb-3 text-sm font-semibold text-gray-900">Hình thức</Text>
          <View className="flex-row gap-3">
            {typeOptions.map((t) => {
              const isActive = form.type === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => update("type", t.value)}
                  className={`flex-1 px-4 py-3 rounded-xl ${
                    isActive
                      ? t.value === "GIVE"
                        ? "bg-[#7DD3CE]"
                        : "bg-[#FFB6C1]"
                      : "bg-gray-100"
                  }`}
                >
                  <Text className={`text-sm text-center ${isActive ? "text-white font-medium" : "text-gray-700"}`}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Condition */}
        <View className="mb-5">
          <Text className="mb-3 text-sm font-semibold text-gray-900">Tình trạng</Text>
          <View className="flex-row flex-wrap gap-2">
            {conditions.map((c) => {
              const isActive = form.condition === c.value;
              return (
                <Pressable
                  key={c.label}
                  onPress={() => update("condition", c.value)}
                  className={`px-4 py-2.5 rounded-xl ${isActive ? "bg-[#FFD97D]" : "bg-gray-100"}`}
                >
                  <Text className={`text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Location */}
        <View className="mb-5">
          <View className="flex-row items-center gap-2 mb-2">
            <MapPin size={16} color="#7DD3CE" />
            <Text className="text-sm text-gray-700">Vị trí</Text>
          </View>
          <TextInput
            placeholder="VD: Ký túc xá A, ĐHQG TP.HCM"
            value={form.location}
            onChangeText={(v) => update("location", v)}
            className="h-12 rounded-xl bg-gray-50 px-4 text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t px-6 py-4">
        <Pressable
          onPress={submit}
          disabled={submitting}
          className="h-14 rounded-full items-center justify-center"
          style={{
            background: "linear-gradient(to right, #7DD3CE, #FFB6C1)",
            backgroundColor: "#7DD3CE",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Đăng tin</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
