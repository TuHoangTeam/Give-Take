import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  Apple,
  Chrome,
  Eye,
  EyeOff,
  Facebook,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { login, register } from "../../utils/api";

export default function AuthScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError(null);

    const email = form.email.trim();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();
    const name = (form.name || email.split("@")[0] || "Bạn").trim();
    const phone = form.phone.trim();
    const location = form.location.trim();

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    if (isSignUp && (!name || password !== confirmPassword)) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (isSignUp && (!phone || !location)) {
      setError("Vui lòng nhập số điện thoại và địa chỉ");
      return;
    }

    try {
      setLoading(true);
      const res = isSignUp
        ? await register(name, email, password, phone, location)
        : await login(email, password);

      await AsyncStorage.multiSet([
        ["authToken", res.token],
        ["userName", res.user.name || name],
        ["userEmail", res.user.email],
      ]);

      router.replace("/home");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const socialButtons = [
    { label: "Facebook", icon: Facebook, bg: "#1877F2", color: "#fff" },
    { label: "Google", icon: Chrome, bg: "#fff", color: "#374151", border: "#E5E7EB" },
    { label: "Apple", icon: Apple, bg: "#000", color: "#fff" },
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        className="flex-1 bg-gradient-to-br from-[#A8E6E2]/20 via-[#FFD4DC]/20 to-[#FFE8B3]/20"
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white rounded-3xl shadow-xl p-6 mt-8">
          <View className="items-center mb-8">
            <Image
              source={require("../../assets/images/logo.png")}
              className="w-20 h-20 mb-4"
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold">
              {isSignUp ? "Đăng ký" : "Đăng nhập"}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {isSignUp
                ? "Tạo tài khoản để tham gia cộng đồng"
                : "Chào mừng trở lại!"}
            </Text>
          </View>

          <View className="gap-4">
            {isSignUp && (
              <View className="gap-2">
                <Text className="text-sm text-gray-700">Họ và tên</Text>
                <View className="relative">
                  <User
                    size={18}
                    color="#9CA3AF"
                    style={{ position: "absolute", left: 12, top: 16 }}
                  />
                  <TextInput
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChangeText={(v) => handleChange("name", v)}
                    className="pl-10 pr-3 h-12 rounded-xl bg-gray-100"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            {isSignUp && (
              <View className="gap-2">
                <Text className="text-sm text-gray-700">Số điện thoại</Text>
                <View className="relative">
                  <Phone
                    size={18}
                    color="#9CA3AF"
                    style={{ position: "absolute", left: 12, top: 16 }}
                  />
                  <TextInput
                    placeholder="0901234567"
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={(v) => handleChange("phone", v)}
                    className="pl-10 pr-3 h-12 rounded-xl bg-gray-100"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            {isSignUp && (
              <View className="gap-2">
                <Text className="text-sm text-gray-700">Địa chỉ</Text>
                <View className="relative">
                  <MapPin
                    size={18}
                    color="#9CA3AF"
                    style={{ position: "absolute", left: 12, top: 16 }}
                  />
                  <TextInput
                    placeholder="TP. Hồ Chí Minh"
                    value={form.location}
                    onChangeText={(v) => handleChange("location", v)}
                    className="pl-10 pr-3 h-12 rounded-xl bg-gray-100"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            <View className="gap-2">
              <Text className="text-sm text-gray-700">Email</Text>
              <View className="relative">
                <Mail
                  size={18}
                  color="#9CA3AF"
                  style={{ position: "absolute", left: 12, top: 16 }}
                />
                <TextInput
                  placeholder="example@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(v) => handleChange("email", v)}
                  className="pl-10 pr-3 h-12 rounded-xl bg-gray-100"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm text-gray-700">Mật khẩu</Text>
              <View className="relative">
                <Lock
                  size={18}
                  color="#9CA3AF"
                  style={{ position: "absolute", left: 12, top: 16 }}
                />
                <TextInput
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(v) => handleChange("password", v)}
                  className="pl-10 pr-10 h-12 rounded-xl bg-gray-100"
                  placeholderTextColor="#9CA3AF"
                />
                <Pressable
                  onPress={() => setShowPassword((p) => !p)}
                  style={{ position: "absolute", right: 12, top: 14 }}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#6B7280" />
                  ) : (
                    <Eye size={18} color="#6B7280" />
                  )}
                </Pressable>
              </View>
            </View>

            {isSignUp && (
              <View className="gap-2">
                <Text className="text-sm text-gray-700">Xác nhận mật khẩu</Text>
                <View className="relative">
                  <Lock
                    size={18}
                    color="#9CA3AF"
                    style={{ position: "absolute", left: 12, top: 16 }}
                  />
                  <TextInput
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={form.confirmPassword}
                    onChangeText={(v) => handleChange("confirmPassword", v)}
                    className="pl-10 pr-3 h-12 rounded-xl bg-gray-100"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            {!isSignUp && (
              <View className="items-end">
                <Pressable>
                  <Text className="text-sm text-[#7DD3CE]">
                    Quên mật khẩu?
                  </Text>
                </Pressable>
              </View>
            )}

            {error && (
              <Text className="text-red-500 text-sm text-center">{error}</Text>
            )}

            <Pressable
              disabled={loading}
              onPress={handleSubmit}
              className="w-full h-12 bg-[#7DD3CE] rounded-full items-center justify-center mt-2"
              style={loading ? { opacity: 0.6 } : undefined}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">
                  {isSignUp ? "Đăng ký" : "Đăng nhập"}
                </Text>
              )}
            </Pressable>

            {isSignUp && (
              <Text className="text-xs text-gray-500 text-center">
                Bằng việc đăng ký, bạn đồng ý với Điều khoản và Chính sách bảo mật
              </Text>
            )}
          </View>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-3 text-sm text-gray-500">hoặc</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <View className="gap-3">
            {socialButtons.map((btn) => (
              <Pressable
                key={btn.label}
                className="w-full h-12 rounded-full flex-row items-center justify-center gap-3"
                style={{
                  backgroundColor: btn.bg,
                  borderWidth: btn.border ? 2 : 0,
                  borderColor: btn.border,
                }}
              >
                <btn.icon size={18} color={btn.color} />
                <Text
                  className="font-medium"
                  style={{ color: btn.color }}
                >
                  Tiếp tục với {btn.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="items-center mt-6">
            <Text className="text-sm text-gray-600">
              {isSignUp ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
              <Text
                className="text-[#7DD3CE] font-semibold"
                onPress={() => setIsSignUp((p) => !p)}
              >
                {isSignUp ? " Đăng nhập" : " Đăng ký ngay"}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
