import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, FileText, Mail, MapPin, Phone, User } from "lucide-react-native";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { useAppContext } from "../../contexts/AppContext";
import { getMe, updateMe, uploadAvatar } from "../../utils/api";

const primaryStart = "#78D0C8";
const primaryEnd = "#6BC4B2";
const fieldBg = "#F4F6F9";
const labelColor = "#5B6470";

export default function EditProfileScreen() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useAppContext();

  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [phone, setPhone] = useState(userProfile.phone);
  const [location, setLocation] = useState(userProfile.location);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatar, setAvatar] = useState(userProfile.avatar || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(userProfile.name);
    setEmail(userProfile.email);
    setPhone(userProfile.phone);
    setLocation(userProfile.location);
    setBio(userProfile.bio);
    setAvatar(userProfile.avatar || "");
  }, [userProfile]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMe();
        if (!mounted) return;
        setName(me?.name || "");
        setEmail(me?.email || "");
        setPhone(me?.phone || "");
        setLocation(me?.location || "");
        setBio(me?.bio || "");
        setAvatar(me?.avatar || "");
        updateUserProfile({
          name: me?.name,
          email: me?.email,
          phone: me?.phone,
          location: me?.location,
          bio: me?.bio,
          avatar: me?.avatar,
        });
      } catch (err) {
        // Ignore fetch errors here; screen still usable.
      }
    })();
    return () => {
      mounted = false;
    };
  }, [updateUserProfile]);

  const initials = useMemo(() => {
    const parts = (userProfile.name || "").trim().split(" ").filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [userProfile.name]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMe({ name, email, phone, location, bio });
      updateUserProfile({ name, email, phone, location, bio });
      Alert.alert("Đã lưu", "Hồ sơ của bạn đã được cập nhật.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert("Không thể lưu", err?.message || "Vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Cần quyền truy cập", "Cho phép quyền thư viện để đổi ảnh đại diện.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const nameFromAsset = asset.fileName || uri.split("/").pop() || "avatar.jpg";
    const type = asset.mimeType || "image/jpeg";

    const formData = new FormData();
    formData.append("avatar", {
      uri,
      name: nameFromAsset,
      type,
    } as any);

    setUploading(true);
    try {
      const res = await uploadAvatar(formData);
      const newAvatar = (res as any)?.avatar || uri;
      setAvatar(newAvatar);
      updateUserProfile({ avatar: newAvatar });
      Alert.alert("Đã cập nhật ảnh", "Ảnh đại diện đã được thay đổi.");
    } catch (err: any) {
      Alert.alert("Không thể đổi ảnh", err?.message || "Vui lòng thử lại");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => router.back();

  return (
    <View className="flex-1" style={{ backgroundColor: "#F7FAFB" }}>
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-[#E6E9ED] bg-white">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
          <ArrowLeft size={22} color="#111" />
        </Pressable>
        <Text className="text-lg font-semibold">Chỉnh sửa thông tin</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="px-6 pt-5" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-sm mb-3" style={{ color: labelColor }}>
            Ảnh đại diện
          </Text>
          <View className="flex-row items-center gap-4">
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: "#E3F6F3", borderWidth: 1, borderColor: "#D5EDE7" }}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} className="w-full h-full rounded-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full rounded-full items-center justify-center" style={{ backgroundColor: "#9AD7D0" }}>
                  <Text className="text-2xl font-bold text-white">{initials}</Text>
                </View>
              )}
              {uploading && (
                <View className="absolute inset-0 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <Pressable
              className="flex-row items-center px-4 py-3 rounded-full"
              style={{ borderWidth: 1, borderColor: "#8FD3C7", backgroundColor: "#F0FBF8" }}
              onPress={handlePickAvatar}
              disabled={uploading}
            >
              <Camera size={18} color={primaryEnd} />
              <Text className="ml-2 font-medium" style={{ color: primaryEnd }}>
                {uploading ? "Đang tải..." : "Đổi ảnh"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="bg-white rounded-2xl px-4 py-5 shadow-sm" style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10 }}>
          <Text className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>
            Thông tin cơ bản
          </Text>

          <Field label="Họ và tên" icon={<User size={18} color={primaryEnd} />} value={name} onChangeText={setName} placeholder="Nhập họ tên" />
          <Field
            label="Email"
            icon={<Mail size={18} color={primaryEnd} />}
            value={email}
            onChangeText={setEmail}
            placeholder="email@domain.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Số điện thoại"
            icon={<Phone size={18} color={primaryEnd} />}
            value={phone}
            onChangeText={setPhone}
            placeholder="09xx xxx xxx"
            keyboardType="phone-pad"
          />
          <Field
            label="Địa chỉ"
            icon={<MapPin size={18} color={primaryEnd} />}
            value={location}
            onChangeText={setLocation}
            placeholder="TP. Hồ Chí Minh"
          />

          <Text className="text-sm font-semibold mt-4 mb-2" style={{ color: labelColor }}>
            Giới thiệu bản thân
          </Text>
          <View className="flex-row items-start rounded-2xl px-3 py-3" style={{ backgroundColor: fieldBg }}>
            <FileText size={18} color={primaryEnd} style={{ marginTop: 6 }} />
            <TextInput
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Yêu thích chia sẻ và tái sử dụng đồ cũ 🌱"
              placeholderTextColor="#9CA3AF"
              value={bio}
              onChangeText={setBio}
              className="flex-1 ml-2 text-base"
              style={{ paddingTop: 4, paddingRight: 6 }}
            />
          </View>
        </View>

        <View className="mt-5 rounded-2xl px-4 py-4" style={{ backgroundColor: "#E8F3FF", borderColor: "#C9E0FF", borderWidth: 1 }}>
          <View className="flex-row items-start">
            <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#D2E8FF" }}>
              <Text className="text-lg">💡</Text>
            </View>
            <Text className="flex-1 text-sm" style={{ color: "#1F2B3A" }}>
              Thông tin của bạn sẽ được hiển thị công khai cho những người quan tâm đến món đồ bạn đăng. Hãy đảm bảo thông tin chính xác để dễ dàng liên lạc!
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E6E9ED] px-6 py-4">
        <Pressable
          className="h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: primaryStart }}
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="font-semibold text-white">{saving ? "Đang lưu..." : "Lưu thay đổi"}</Text>
        </Pressable>
        <Pressable
          className="h-14 rounded-full items-center justify-center mt-3"
          style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#D7E2E8" }}
          onPress={handleCancel}
          disabled={saving}
        >
          <Text className="font-semibold" style={{ color: "#3A4A5A" }}>
            Hủy
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type FieldProps = {
  label: string;
  icon: ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

function Field({ label, icon, value, onChangeText, placeholder, keyboardType = "default", autoCapitalize }: FieldProps) {
  return (
    <View className="mb-3">
      <Text className="text-sm mb-2" style={{ color: labelColor }}>
        {label}
      </Text>
      <View className="flex-row items-center rounded-2xl px-3" style={{ backgroundColor: fieldBg }}>
        <View className="w-10 items-center justify-center">{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="flex-1 h-12 text-base"
        />
      </View>
    </View>
  );
}
