import { resetPassword } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UnlockKeyhole,
  Users,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotify, setPushNotify] = useState(true);
  const [wishlistNotify, setWishlistNotify] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sections = [
    {
      title: "Hiển thị",
      items: [
        {
          icon: darkMode ? Moon : Sun,
          label: "Chế độ",
          desc: darkMode ? "Chế độ tối" : "Chế độ sáng",
          type: "switch",
          value: darkMode,
          onToggle: () => setDarkMode((v) => !v),
          colors: { bg: "#E8F6F3", fg: "#0EA5E9" },
        },
      ],
    },
    {
      title: "Thông báo",
      items: [
        {
          icon: Bell,
          label: "Thông báo push",
          desc: "Nhận thông báo khi có tin nhắn mới",
          type: "switch",
          value: pushNotify,
          onToggle: () => setPushNotify((v) => !v),
          colors: { bg: "#E8F5FF", fg: "#22C55E" },
        },
        {
          icon: Users,
          label: "Thông báo wishlist",
          desc: "Nhận thông báo khi có đồ phù hợp",
          type: "switch",
          value: wishlistNotify,
          onToggle: () => setWishlistNotify((v) => !v),
          colors: { bg: "#EAF1FF", fg: "#22C55E" },
        },
      ],
    },
    {
      title: "Bảo mật & Quyền riêng tư",
      items: [
        { icon: ShieldCheck, label: "Quyền riêng tư", desc: "Quản lý thông tin cá nhân", colors: { bg: "#EAF9F5", fg: "#0EA5E9" } },
        { icon: Globe, label: "Ngôn ngữ", desc: "Tiếng Việt", colors: { bg: "#EFF6FF", fg: "#0EA5E9" } },
      ],
    },
    {
      title: "Hỗ trợ",
      items: [
        { icon: HelpCircle, label: "Trung tâm trợ giúp", desc: "Câu hỏi thường gặp & hướng dẫn", colors: { bg: "#F0F7FF", fg: "#0EA5E9" } },
        { icon: Info, label: "Về Give & Take", desc: "Phiên bản 1.0.0", colors: { bg: "#F0F7FF", fg: "#0EA5E9" } },
      ],
    },
  ];

  const handleResetPassword = useCallback(async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ mật khẩu mới.");
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      Alert.alert("Không khớp", "Mật khẩu mới và nhập lại không trùng khớp.");
      return;
    }
    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Thiếu token", "Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.");
        return;
      }
      await resetPassword(token, newPassword.trim());
      Alert.alert("Thành công", "Đặt lại mật khẩu thành công.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      Alert.alert("Lỗi", err?.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setSubmitting(false);
    }
  }, [confirmPassword, newPassword]);

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center bg-gray-100">
          <ArrowLeft size={20} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Cài đặt</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {sections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="text-sm font-medium text-gray-500 mb-3">{section.title}</Text>
            <View className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  className={`flex-row items-center gap-3 p-4 ${idx !== section.items.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{ backgroundColor: item.colors?.bg || "#E8F6F3" }}
                  >
                    <item.icon size={20} color={item.colors?.fg || "#0EA5E9"} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-sm text-gray-900">{item.label}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">{item.desc}</Text>
                  </View>
                  {item.type === "switch" ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      thumbColor={item.value ? "#22C55E" : "#f4f3f4"}
                      trackColor={{ false: "#E5E7EB", true: "#C7F3D8" }}
                    />
                  ) : (
                    <ChevronRight size={18} color="#9CA3AF" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-500 mb-3">Đặt lại mật khẩu</Text>
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-11 h-11 rounded-full items-center justify-center bg-[#EAF9F5]">
                <UnlockKeyhole size={20} color="#0EA5E9" />
              </View>
              <Text className="font-semibold text-sm text-gray-900">Reset password</Text>
            </View>
            <TextInput
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              className="h-12 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
            <TextInput
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="h-12 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
            <Pressable
              onPress={handleResetPassword}
              disabled={submitting}
              className={`h-12 rounded-2xl items-center justify-center ${submitting ? "bg-[#86EFAC]" : "bg-[#22C55E]"}`}
            >
              <Text className="text-white font-semibold text-sm">{submitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable className="h-14 rounded-2xl border-2 border-red-200 items-center justify-center flex-row gap-2 bg-white">
          <LogOut size={18} color="#DC2626" />
          <Text className="text-red-600 font-semibold">Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
