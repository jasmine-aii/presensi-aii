import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, TriangleAlert, Settings2, type LucideIcon } from 'lucide-react-native';
import { color, interFamily, space, radius } from '../theme';
import { Txt, Button, LogoMark, GlowCircle, LangSwitch } from '../components';
import { useLang } from '../i18n/LangContext';
import { useAuth } from '../auth/AuthContext';

export function LoginScreen() {
  const { s } = useLang();
  const { signIn, configured } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      setError(s.auth.errEmpty);
      return;
    }
    setError(null);
    setBusy(true);
    const { error: err } = await signIn(email, password);
    setBusy(false);
    if (err) {
      setError(/invalid|credential/i.test(err) ? s.auth.errInvalid : s.auth.errGeneric);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.paper }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Navy hero */}
        <View style={{ backgroundColor: color.deepNavy, paddingHorizontal: space.xl, paddingTop: insets.top + 32, paddingBottom: space['2xl'], borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, overflow: 'hidden' }}>
          <GlowCircle size={220} top={-80} right={-60} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <LogoMark height={30} fill={color.white} />
            <LangSwitch />
          </View>
          <Txt w="extrabold" size={30} color={color.white} style={{ marginTop: space['2xl'], letterSpacing: -0.5 }}>
            {s.auth.welcome}
          </Txt>
          <Txt size={15} color="rgba(255,255,255,0.72)" style={{ marginTop: space.sm }}>
            {s.auth.subtitle}
          </Txt>
        </View>

        <View style={{ paddingHorizontal: space.xl, paddingTop: space.xl, gap: space.lg, flex: 1 }}>
          {!configured && (
            <View style={{ flexDirection: 'row', gap: space.md, backgroundColor: color.dangerBg, borderRadius: radius.md, padding: space.lg }}>
              <Settings2 size={20} color={color.danger} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Txt w="bold" size={13} color={color.danger}>
                  {s.auth.setupTitle}
                </Txt>
                <Txt size={12} color={color.danger} style={{ marginTop: space.xs, lineHeight: 17 }}>
                  {s.auth.setupMsg}
                </Txt>
              </View>
            </View>
          )}

          <LabeledInput
            label={s.auth.email}
            icon={Mail}
            value={email}
            onChangeText={setEmail}
            placeholder={s.auth.emailPh}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <View>
            <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: space.sm }}>
              {s.auth.password}
            </Txt>
            <View style={inputWrap}>
              <Lock size={20} color={color.anugrahBlue} strokeWidth={2} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={s.auth.passwordPh}
                placeholderTextColor={color.muted}
                secureTextEntry={!show}
                autoCapitalize="none"
                autoComplete="password"
                onSubmitEditing={onSubmit}
                returnKeyType="go"
                style={inputText}
              />
              <Pressable onPress={() => setShow((v) => !v)} hitSlop={8} accessibilityLabel="toggle password">
                {show ? <EyeOff size={18} color={color.muted} strokeWidth={2} /> : <Eye size={18} color={color.muted} strokeWidth={2} />}
              </Pressable>
            </View>
          </View>

          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <TriangleAlert size={16} color={color.danger} strokeWidth={2} />
              <Txt size={13} color={color.danger} style={{ flex: 1 }}>
                {error}
              </Txt>
            </View>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            label={busy ? s.auth.signingIn : s.auth.signIn}
            disabled={busy || !configured}
            onPress={onSubmit}
          />

          <Txt size={12} color={color.muted} style={{ textAlign: 'center', lineHeight: 18, marginTop: space.xs }}>
            {s.auth.footer}
          </Txt>
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputWrap = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: space.md,
  backgroundColor: color.white,
  borderWidth: 1,
  borderColor: color.line,
  borderRadius: radius.sm,
  paddingHorizontal: space.md,
  paddingVertical: space.md,
};

const inputText = {
  flex: 1,
  fontFamily: interFamily('regular'),
  fontSize: 15,
  color: color.ink,
  padding: 0,
};

function LabeledInput({
  label,
  icon: Icon,
  ...props
}: { label: string; icon: LucideIcon } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: space.sm }}>
        {label}
      </Txt>
      <View style={inputWrap}>
        <Icon size={20} color={color.anugrahBlue} strokeWidth={2} />
        <TextInput placeholderTextColor={color.muted} style={inputText} {...props} />
      </View>
    </View>
  );
}

export default LoginScreen;
