import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList, DrawerNavigationProp } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CurrentUserProvider, initialStore, loadStore, Product, Role, StoreData, StoreProvider, TransactionItem, User, useCurrentUser, useLogout, useStore } from './src/store';

type DrawerRoutes = {
  Home: undefined;
  Pencarian: undefined;
  'Tambah Produk': undefined;
  'Produk Unggulan': undefined;
  Transaksi: undefined;
  'Kelola Pengguna': undefined;
  Profile: undefined;
};

const Drawer = createDrawerNavigator<DrawerRoutes>();

const colors = {
  ink: '#173B33',
  muted: '#70817A',
  forest: '#164C3E',
  forestLight: '#E6F0EB',
  canvas: '#F5F7F4',
  white: '#FFFFFF',
  line: '#E4EAE5',
  orange: '#D98B45',
  danger: '#B94A48',
  paleRed: '#FBECEA',
};

export default function App() {
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = () => {
    setLoadError('');
    loadStore().then(setStoreData).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : 'Data aplikasi gagal dimuat.');
    });
  };

  useEffect(load, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {storeData ? (
        <StoreProvider initialData={storeData}>
          <AppFlow />
        </StoreProvider>
      ) : loadError ? (
        <ErrorScreen message={loadError} onReset={() => setStoreData(initialStore)} />
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.forest} size="large" />
          <Text style={styles.loadingText}>Menyiapkan KasirKu...</Text>
        </View>
      )}
    </SafeAreaProvider>
  );
}

function ErrorScreen({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <View style={styles.centered}>
      <View style={styles.logoMark}><Ionicons name="warning-outline" size={28} color={colors.danger} /></View>
      <Text style={styles.heading}>Data tidak dapat dibuka</Text>
      <Text style={[styles.bodyText, { textAlign: 'center', marginTop: 8 }]}>{message}</Text>
      <Button label="Mulai dengan data demo" onPress={onReset} style={{ marginTop: 22 }} />
    </View>
  );
}

function AppFlow() {
  const [user, setUser] = useState<User | null>(null);
  const { persistenceError } = useStore();
  useEffect(() => {
    if (persistenceError) Alert.alert('Penyimpanan gagal', `Perubahan hanya tersimpan selama aplikasi terbuka.\n\n${persistenceError}`);
  }, [persistenceError]);
  return user ? (
    <CurrentUserProvider user={user} logout={() => setUser(null)}>
      <MainDrawer user={user} onLogout={() => setUser(null)} />
    </CurrentUserProvider>
  ) : <LoginScreen onLogin={setUser} />;
}

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const { data, addUser } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerVisible, setRegisterVisible] = useState(false);
  const [registerConfirmVisible, setRegisterConfirmVisible] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const login = () => {
    const found = data.users.find((item) =>
      item.username.toLowerCase() === username.trim().toLowerCase() &&
      item.password === password &&
      item.active
    );
    if (!found) {
      setError('Username atau password salah, atau akun sedang dinonaktifkan.');
      setSuccess('');
      return;
    }
    setError('');
    setSuccess('');
    onLogin(found);
  };

  const register = () => {
    const name = fullName.trim();
    const safeUsername = registerUsername.trim();
    if (!name || !safeUsername || !registerPassword) {
      setError('Nama lengkap, username, dan password wajib diisi.');
      setSuccess('');
      return;
    }
    if (safeUsername.length < 3) {
      setError('Username minimal 3 karakter.');
      setSuccess('');
      return;
    }
    if (registerPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      setSuccess('');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      setSuccess('');
      return;
    }
    const duplicate = data.users.some((item) => item.username.toLowerCase() === safeUsername.toLowerCase());
    if (duplicate) {
      setError('Username sudah digunakan, pilih yang lain.');
      setSuccess('');
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      username: safeUsername,
      password: registerPassword,
      role: 'Kasir',
      active: true,
    };

    addUser({
      name: newUser.name,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
    });

    setError('');
    setSuccess('Akun berhasil dibuat. Silakan masuk dengan username dan password baru.');
    setMode('login');
    setUsername(safeUsername);
    setPassword(registerPassword);
    setFullName('');
    setRegisterUsername('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
    onLogin(newUser);
  };

  return (
    <KeyboardAvoidingView style={styles.loginRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
        <View style={styles.loginBrand}>
          <View style={styles.logoMark}><Ionicons name="leaf" size={27} color={colors.white} /></View>
          <Text style={styles.brandName}>KasirKu</Text>
          <Text style={styles.brandTagline}>Kelola usaha dengan lebih mudah.</Text>
        </View>
        <View style={styles.loginCard}>
          {mode === 'login' ? (
            <>
              <Text style={styles.heading}>Selamat datang</Text>
              <Text style={styles.bodyText}>Masuk untuk melanjutkan ke dashboard.</Text>
              <Field label="Username" value={username} onChangeText={setUsername} placeholder="Masukkan username" icon="person-outline" autoCapitalize="none" />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Masukkan password"
                icon="lock-closed-outline"
                secureTextEntry={!visible}
                autoCapitalize="none"
                rightIcon={visible ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setVisible(!visible)}
                onSubmitEditing={login}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {success ? <Text style={styles.successText}>{success}</Text> : null}
              <Button label="Masuk ke aplikasi" icon="arrow-forward" onPress={login} style={{ marginTop: 10 }} />
              <View style={styles.demoBox}>
                <Text style={styles.demoTitle}>Pilih akun demo untuk mengisi otomatis</Text>
                <View style={styles.demoAccounts}>
                  <Pressable style={styles.demoAccountButton} onPress={() => { setUsername('admin'); setPassword('admin123'); setError(''); setSuccess(''); }}>
                    <Ionicons name="shield-checkmark-outline" size={17} color={colors.forest} />
                    <Text style={styles.demoAccountText}>Admin</Text>
                  </Pressable>
                  <Pressable style={styles.demoAccountButton} onPress={() => { setUsername('kasir'); setPassword('kasir123'); setError(''); setSuccess(''); }}>
                    <Ionicons name="person-outline" size={17} color={colors.forest} />
                    <Text style={styles.demoAccountText}>Kasir</Text>
                  </Pressable>
                </View>
                <Text style={styles.demoText}>Atau masukkan admin / admin123 maupun kasir / kasir123.</Text>
              </View>
              <View style={styles.authPrompt}>
                <Text style={styles.authPromptText}>Belum punya akun?</Text>
                <Pressable
                  onPress={() => { setMode('register'); setError(''); setSuccess(''); }}
                  hitSlop={8}
                >
                  <Text style={styles.authPromptLink}>Daftar</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.heading}>Buat akun baru</Text>
              <Text style={styles.bodyText}>Daftarkan diri sebagai kasir untuk mulai transaksi.</Text>
              <Field label="Nama lengkap" value={fullName} onChangeText={setFullName} placeholder="Masukkan nama lengkap" icon="person-outline" autoCapitalize="sentences" />
              <Field label="Username" value={registerUsername} onChangeText={setRegisterUsername} placeholder="Buat username" icon="at-outline" autoCapitalize="none" />
              <Field
                label="Password"
                value={registerPassword}
                onChangeText={setRegisterPassword}
                placeholder="Buat password"
                icon="lock-closed-outline"
                secureTextEntry={!registerVisible}
                autoCapitalize="none"
                rightIcon={registerVisible ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setRegisterVisible(!registerVisible)}
              />
              <Field
                label="Konfirmasi password"
                value={registerConfirmPassword}
                onChangeText={setRegisterConfirmPassword}
                placeholder="Ulangi password"
                icon="lock-closed-outline"
                secureTextEntry={!registerConfirmVisible}
                autoCapitalize="none"
                rightIcon={registerConfirmVisible ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setRegisterConfirmVisible(!registerConfirmVisible)}
                onSubmitEditing={register}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {success ? <Text style={styles.successText}>{success}</Text> : null}
              <Button label="Daftar akun" icon="person-add-outline" onPress={register} style={{ marginTop: 10 }} />
              <View style={styles.authPrompt}>
                <Text style={styles.authPromptText}>Sudah punya akun?</Text>
                <Pressable
                  onPress={() => { setMode('login'); setError(''); setSuccess(''); }}
                  hitSlop={8}
                >
                  <Text style={styles.authPromptLink}>Masuk</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
        <Text style={styles.loginFootnote}>Prototipe akademik · Data tersimpan di perangkat</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MainDrawer({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawer {...props} user={user} onLogout={onLogout} />}
        screenOptions={{
          headerStyle: { backgroundColor: colors.white },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '700' },
          drawerActiveTintColor: colors.forest,
          drawerActiveBackgroundColor: colors.forestLight,
          drawerInactiveTintColor: colors.muted,
          drawerLabelStyle: { fontSize: 14, fontWeight: '600', marginLeft: -12 },
          drawerStyle: { backgroundColor: colors.white, width: 294 },
          sceneStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'Beranda', drawerIcon: menuIcon('home-outline') }} />
        <Drawer.Screen name="Pencarian" component={SearchScreen} options={{ title: 'Pencarian Produk', drawerIcon: menuIcon('search-outline') }} />
        {user.role === 'Admin' ? <Drawer.Screen name="Tambah Produk" component={ProductManagementScreen} options={{ title: 'Kelola Produk', drawerIcon: menuIcon('cube-outline') }} /> : null}
        <Drawer.Screen name="Produk Unggulan" component={FeaturedScreen} options={{ title: 'Produk Unggulan', drawerIcon: menuIcon('star-outline') }} />
        <Drawer.Screen name="Transaksi" component={TransactionsScreen} options={{ title: 'Transaksi', drawerIcon: menuIcon('receipt-outline') }} />
        {user.role === 'Admin' ? <Drawer.Screen name="Kelola Pengguna" component={UsersScreen} options={{ title: 'Kelola Pengguna', drawerIcon: menuIcon('people-outline') }} /> : null}
        <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil', drawerIcon: menuIcon('person-circle-outline') }} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

function menuIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;
}

function CustomDrawer(props: DrawerContentComponentProps & { user: User; onLogout: () => void }) {
  const { user, onLogout } = props;
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.drawerBrand}>
        <View style={styles.drawerAvatar}><Text style={styles.drawerAvatarText}>{user.name.slice(0, 1).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.drawerUserName}>{user.name}</Text>
          <Text style={styles.drawerRole}>{user.role} · @{user.username}</Text>
        </View>
      </View>
      <DrawerItemList {...props} />
      <View style={styles.drawerFooter}>
        <View style={styles.drawerDivider} />
        <Pressable style={styles.logoutRow} onPress={() => Alert.alert('Keluar dari akun?', 'Anda akan kembali ke halaman login.', [{ text: 'Batal', style: 'cancel' }, { text: 'Keluar', style: 'destructive', onPress: onLogout }])}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>
        <Text style={styles.drawerVersion}>KASIRKU · VERSI DEMO</Text>
      </View>
    </DrawerContentScrollView>
  );
}

function HomeScreen() {
  const { data } = useStore();
  const navigation = useNavigation<DrawerNavigationProp<DrawerRoutes>>();
  const user = useCurrentUser();
  const totalValue = data.products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const go = (screen: keyof DrawerRoutes) => navigation.navigate(screen);

  return (
    <Screen>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>DASHBOARD {user.role.toUpperCase()}</Text>
        <Text style={styles.heroTitle}>Halo, {user.name.split(' ')[0]} 👋</Text>
        <Text style={styles.heroCopy}>Siap membantu usahamu berjalan hari ini?</Text>
        <View style={styles.heroBottom}>
          <View><Text style={styles.heroMetricLabel}>Penjualan tercatat</Text><Text style={styles.heroMetric}>{formatCurrency(data.transactions.reduce((sum, trx) => sum + trx.total, 0))}</Text></View>
          <Ionicons name="trending-up" size={26} color="#C4E5D4" />
        </View>
      </View>
      <View style={styles.statRow}>
        <StatCard label="Produk" value={String(data.products.length)} icon="cube-outline" />
        <StatCard label="Stok tersedia" value={String(data.products.reduce((sum, product) => sum + product.stock, 0))} icon="layers-outline" />
      </View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Akses cepat</Text><Text style={styles.sectionCaption}>Pilih aktivitas</Text></View>
      <View style={styles.quickGrid}>
        <QuickAction title="Cari produk" subtitle="Temukan barang" icon="search-outline" onPress={() => go('Pencarian')} />
        <QuickAction title="Transaksi" subtitle="Buat penjualan" icon="receipt-outline" onPress={() => go('Transaksi')} />
        {user.role === 'Admin' ? <QuickAction title="Tambah produk" subtitle="Kelola katalog" icon="add-circle-outline" onPress={() => go('Tambah Produk')} /> : null}
        <QuickAction title="Unggulan" subtitle="Produk favorit" icon="star-outline" onPress={() => go('Produk Unggulan')} />
      </View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Produk unggulan</Text><Text style={styles.sectionCaption}>{data.products.filter((product) => product.featured).length} produk</Text></View>
      {data.products.filter((product) => product.featured).slice(0, 3).map((product) => <ProductRow key={product.id} product={product} />)}
      <Text style={styles.inventoryNote}>Nilai stok tersedia: {formatCurrency(totalValue)}</Text>
    </Screen>
  );
}

function SearchScreen() {
  const { data } = useStore();
  const [query, setQuery] = useState('');
  const products = data.products.filter((product) =>
    `${product.name} ${product.category}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Screen>
      <PageHeading title="Cari produk" subtitle="Temukan produk berdasarkan nama atau kategori." />
      <Field label="" value={query} onChangeText={setQuery} placeholder="Contoh: kopi, makanan..." icon="search-outline" />
      <Text style={styles.resultCount}>{products.length} produk ditemukan</Text>
      {products.length ? products.map((product) => <ProductRow key={product.id} product={product} />) : <EmptyState title="Produk tidak ditemukan" copy="Coba kata kunci lain." />}
    </Screen>
  );
}

function ProductManagementScreen() {
  const { data, addProduct, updateProduct, deleteProduct } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [featured, setFeatured] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setStock('');
    setCategory('');
    setFeatured(false);
    setError('');
  };

  const editProduct = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setCategory(product.category);
    setFeatured(product.featured);
  };

  const saveProduct = () => {
    const numericPrice = Number(price);
    const numericStock = Number(stock);
    if (!name.trim() || !price.trim() || !stock.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0 || !Number.isInteger(numericStock) || numericStock < 0) {
      setError('Isi nama, harga lebih dari 0, dan stok berupa bilangan bulat nol atau lebih.');
      return;
    }
    const product = { name: name.trim(), price: numericPrice, stock: numericStock, category: category.trim() || 'Umum', featured };
    if (editingId) updateProduct({ ...product, id: editingId });
    else addProduct(product);
    resetForm();
    Alert.alert('Berhasil', editingId ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
  };

  const confirmDelete = (product: Product) => Alert.alert('Hapus produk?', `${product.name} akan dihapus dari katalog.`, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: () => deleteProduct(product.id) },
  ]);

  return (
    <Screen>
      <PageHeading title={editingId ? 'Ubah produk' : 'Kelola produk'} subtitle="Tambah, perbarui, dan atur katalog produk." />
      <Card>
        <Text style={styles.cardTitle}>{editingId ? 'Perbarui produk' : 'Tambah produk baru'}</Text>
        <Field label="Nama produk" value={name} onChangeText={setName} placeholder="Misalnya: Kopi Susu Aren" icon="pricetag-outline" />
        <View style={styles.inputColumns}>
          <View style={{ flex: 1 }}><Field label="Harga (Rp)" value={price} onChangeText={setPrice} placeholder="18000" icon="cash-outline" keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field label="Stok" value={stock} onChangeText={setStock} placeholder="24" icon="layers-outline" keyboardType="numeric" /></View>
        </View>
        <Field label="Kategori" value={category} onChangeText={setCategory} placeholder="Minuman atau makanan" icon="grid-outline" />
        <Pressable style={styles.featuredToggle} onPress={() => setFeatured(!featured)}>
          <Ionicons name={featured ? 'star' : 'star-outline'} size={19} color={featured ? colors.orange : colors.muted} />
          <Text style={styles.featuredToggleText}>Tandai sebagai produk unggulan</Text>
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.formButtons}>
          <Button label={editingId ? 'Simpan perubahan' : 'Simpan produk'} icon="checkmark" onPress={saveProduct} style={{ flex: 1 }} />
          {editingId ? <Button label="Batal" variant="secondary" onPress={resetForm} /> : null}
        </View>
      </Card>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Semua produk</Text><Text style={styles.sectionCaption}>{data.products.length} item</Text></View>
      {data.products.map((product) => (
        <View key={product.id} style={styles.manageProductCard}>
          <ProductRow product={product} />
          <View style={styles.actionRow}>
            <Button label="Ubah" icon="create-outline" variant="secondary" onPress={() => editProduct(product)} style={{ flex: 1 }} />
            <Button label="Hapus" icon="trash-outline" variant="danger" onPress={() => confirmDelete(product)} style={{ flex: 1 }} />
          </View>
        </View>
      ))}
      {!data.products.length ? <EmptyState title="Belum ada produk" copy="Gunakan formulir di atas untuk menambah produk." /> : null}
    </Screen>
  );
}

function FeaturedScreen() {
  const { data } = useStore();
  const featured = data.products.filter((product) => product.featured);
  return (
    <Screen>
      <PageHeading title="Produk unggulan" subtitle="Pilihan produk yang paling menarik untuk pelanggan." />
      {featured.length ? featured.map((product) => <ProductRow key={product.id} product={product} featured />) : <EmptyState title="Belum ada produk unggulan" copy="Admin dapat menandai produk sebagai unggulan di Kelola Produk." />}
    </Screen>
  );
}

function TransactionsScreen() {
  const { data, completeTransaction, deleteTransaction } = useStore();
  const user = useCurrentUser();
  const [cart, setCart] = useState<Record<string, number>>({});
  const cartItems: TransactionItem[] = Object.entries(cart).flatMap(([productId, quantity]) => {
    const product = data.products.find((item) => item.id === productId);
    return product && quantity > 0 ? [{ productId, name: product.name, price: product.price, quantity }] : [];
  });
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const adjust = (product: Product, amount: number) => {
    setCart((current) => {
      const nextQuantity = (current[product.id] ?? 0) + amount;
      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }
      if (nextQuantity > product.stock) {
        Alert.alert('Stok tidak cukup', `Stok ${product.name} tersisa ${product.stock}.`);
        return current;
      }
      return { ...current, [product.id]: nextQuantity };
    });
  };

  const checkout = () => {
    const error = completeTransaction(cartItems, user.name);
    if (error) {
      Alert.alert('Transaksi belum dapat diproses', error);
      return;
    }
    setCart({});
    Alert.alert('Transaksi berhasil', `Total pembayaran ${formatCurrency(total)}.`);
  };

  const removeTransaction = (id: string) => Alert.alert('Hapus transaksi?', 'Produk yang terjual akan dikembalikan ke stok.', [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus transaksi', style: 'destructive', onPress: () => deleteTransaction(id) },
  ]);

  return (
    <Screen>
      <PageHeading title="Transaksi" subtitle={user.role === 'Admin' ? 'Buat transaksi dan tinjau semua riwayat.' : 'Pilih produk untuk membuat transaksi baru.'} />
      <Text style={styles.sectionTitle}>Pilih produk</Text>
      {data.products.filter((product) => product.stock > 0).map((product) => (
        <View key={product.id} style={styles.cartProductRow}>
          <ProductRow product={product} compact />
          <View style={styles.quantityControl}>
            <Pressable style={styles.quantityButton} onPress={() => adjust(product, -1)}><Ionicons name="remove" size={18} color={colors.forest} /></Pressable>
            <Text style={styles.quantityText}>{cart[product.id] ?? 0}</Text>
            <Pressable style={styles.quantityButton} onPress={() => adjust(product, 1)}><Ionicons name="add" size={18} color={colors.forest} /></Pressable>
          </View>
        </View>
      ))}
      <Card style={{ marginTop: 12 }}>
        <View style={styles.totalRow}><Text style={styles.cardTitle}>Total belanja</Text><Text style={styles.totalValue}>{formatCurrency(total)}</Text></View>
        <Text style={styles.mutedSmall}>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} item di keranjang</Text>
        <Button label="Selesaikan transaksi" icon="checkmark-circle-outline" onPress={checkout} disabled={!cartItems.length} style={{ marginTop: 14 }} />
      </Card>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Riwayat transaksi</Text><Text style={styles.sectionCaption}>{data.transactions.length} transaksi</Text></View>
      {data.transactions.map((transaction) => (
        <Card key={transaction.id} style={{ marginBottom: 10 }}>
          <View style={styles.totalRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionTitle}>{formatDate(transaction.createdAt)}</Text>
              <Text style={styles.mutedSmall}>Kasir: {transaction.cashier} · {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} item</Text>
            </View>
            <Text style={styles.totalValue}>{formatCurrency(transaction.total)}</Text>
          </View>
          <Text style={[styles.mutedSmall, { marginTop: 8 }]}>{transaction.items.map((item) => `${item.name} ×${item.quantity}`).join(' · ')}</Text>
          {user.role === 'Admin' ? <Pressable style={styles.deleteTransaction} onPress={() => removeTransaction(transaction.id)}><Ionicons name="trash-outline" size={16} color={colors.danger} /><Text style={styles.deleteTransactionText}>Hapus transaksi</Text></Pressable> : null}
        </Card>
      ))}
      {!data.transactions.length ? <EmptyState title="Belum ada transaksi" copy="Transaksi yang selesai akan muncul di sini." /> : null}
    </Screen>
  );
}

function UsersScreen() {
  const { data, addUser, toggleUser } = useStore();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Kasir');
  const [error, setError] = useState('');

  const createUser = () => {
    if (!name.trim() || !username.trim() || password.length < 6) {
      setError('Isi nama, username, dan password minimal 6 karakter.');
      return;
    }
    if (data.users.some((user) => user.username.toLowerCase() === username.trim().toLowerCase())) {
      setError('Username sudah digunakan. Pilih username lain.');
      return;
    }
    addUser({ name: name.trim(), username: username.trim(), password, role });
    setName('');
    setUsername('');
    setPassword('');
    setError('');
    Alert.alert('Berhasil', `Akun ${role} berhasil dibuat.`);
  };

  return (
    <Screen>
      <PageHeading title="Kelola pengguna" subtitle="Buat akun dan atur status akses anggota tim." />
      <Card>
        <Text style={styles.cardTitle}>Buat akun baru</Text>
        <Field label="Nama lengkap" value={name} onChangeText={setName} placeholder="Nama pengguna" icon="person-outline" />
        <Field label="Username" value={username} onChangeText={setUsername} placeholder="username" icon="at-outline" autoCapitalize="none" />
        <Field label="Password (min. 6 karakter)" value={password} onChangeText={setPassword} placeholder="Buat password" icon="lock-closed-outline" secureTextEntry autoCapitalize="none" />
        <Text style={styles.fieldLabel}>Peran pengguna</Text>
        <View style={styles.roleSelector}>
          {(['Kasir', 'Admin'] as Role[]).map((item) => (
            <Pressable key={item} onPress={() => setRole(item)} style={[styles.roleOption, role === item && styles.roleOptionActive]}>
              <Text style={[styles.roleOptionText, role === item && styles.roleOptionTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button label="Buat akun" icon="person-add-outline" onPress={createUser} style={{ marginTop: 14 }} />
      </Card>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Daftar pengguna</Text><Text style={styles.sectionCaption}>{data.users.length} akun</Text></View>
      {data.users.map((item) => (
        <Card key={item.id} style={styles.userCard}>
          <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{item.name.slice(0, 1).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.transactionTitle}>{item.name}</Text>
            <Text style={styles.mutedSmall}>@{item.username} · {item.role}</Text>
            <Text style={[styles.statusText, { color: item.active ? colors.forest : colors.danger }]}>{item.active ? 'Aktif' : 'Dinonaktifkan'}</Text>
          </View>
          {item.id !== 'admin-1' ? <Pressable style={[styles.userStatusButton, !item.active && styles.userStatusButtonActive]} onPress={() => toggleUser(item.id)}>
            <Text style={[styles.userStatusButtonText, !item.active && { color: colors.forest }]}>{item.active ? 'Nonaktifkan' : 'Aktifkan'}</Text>
          </Pressable> : <Text style={styles.mutedSmall}>Akun utama</Text>}
        </Card>
      ))}
    </Screen>
  );
}

function ProfileScreen() {
  const user = useCurrentUser();
  const logout = useLogout();
  return (
    <Screen>
      <PageHeading title="Profil" subtitle="Informasi akun yang sedang digunakan." />
      <Card style={styles.profileCard}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{user.name.slice(0, 1).toUpperCase()}</Text></View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.bodyText}>@{user.username}</Text>
        <View style={styles.roleBadge}><Ionicons name={user.role === 'Admin' ? 'shield-checkmark-outline' : 'person-outline'} size={15} color={colors.forest} /><Text style={styles.roleBadgeText}>{user.role}</Text></View>
      </Card>
      <Card>
        <ProfileInfo label="Nama pengguna" value={user.name} />
        <ProfileInfo label="Username" value={`@${user.username}`} />
        <ProfileInfo label="Hak akses" value={user.role === 'Admin' ? 'Pengelola aplikasi' : 'Layanan transaksi'} last />
      </Card>
      <Button
        label="Keluar dari akun"
        icon="log-out-outline"
        variant="danger"
        onPress={() => Alert.alert('Keluar dari akun?', 'Anda akan kembali ke halaman login.', [{ text: 'Batal', style: 'cancel' }, { text: 'Keluar', style: 'destructive', onPress: logout }])}
        style={{ marginTop: 14 }}
      />
      <Text style={styles.profileNote}>Akun demo. Untuk penggunaan nyata, hubungkan aplikasi ke autentikasi dan backend yang aman.</Text>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.pageHeading}><Text style={styles.pageTitle}>{title}</Text><Text style={styles.bodyText}>{subtitle}</Text></View>;
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return <View style={styles.statCard}><View style={styles.statIcon}><Ionicons name={icon} size={18} color={colors.forest} /></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function QuickAction({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]} onPress={onPress}>
    <View style={styles.quickIcon}><Ionicons name={icon} size={21} color={colors.forest} /></View>
    <Text style={styles.quickTitle}>{title}</Text>
    <Text style={styles.quickSubtitle}>{subtitle}</Text>
    <Ionicons name="arrow-forward" size={16} color={colors.muted} style={styles.quickArrow} />
  </Pressable>;
}

function ProductRow({ product, featured = false, compact = false }: { product: Product; featured?: boolean; compact?: boolean }) {
  return <View style={[styles.productRow, compact && styles.productRowCompact]}>
    <View style={styles.productIcon}><Ionicons name={product.category.toLowerCase().includes('minum') ? 'cafe-outline' : 'fast-food-outline'} size={20} color={colors.forest} /></View>
    <View style={{ flex: 1 }}>
      <View style={styles.productTitleLine}><Text style={styles.productName}>{product.name}</Text>{(featured || product.featured) ? <Ionicons name="star" size={13} color={colors.orange} /> : null}</View>
      <Text style={styles.productMeta}>{product.category} · Stok {product.stock}</Text>
    </View>
    <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
  </View>;
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  rightIcon,
  onRightPress,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric';
  autoCapitalize?: 'none' | 'sentences';
  onSubmitEditing?: () => void;
}) {
  return <View style={styles.fieldWrap}>
    {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
    <View style={styles.inputShell}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A1ADA7"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={onSubmitEditing ? 'done' : 'next'}
      />
      {rightIcon && onRightPress ? <Pressable onPress={onRightPress} hitSlop={8}><Ionicons name={rightIcon} size={19} color={colors.muted} /></Pressable> : null}
    </View>
  </View>;
}

function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: object;
}) {
  const buttonStyle = variant === 'primary' ? styles.button : variant === 'danger' ? styles.dangerButton : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.buttonText : variant === 'danger' ? styles.dangerButtonText : styles.secondaryButtonText;
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.buttonBase, buttonStyle, style, disabled && styles.disabledButton, pressed && !disabled && styles.pressed]}>
    {icon ? <Ionicons name={icon} size={17} color={variant === 'primary' ? colors.white : variant === 'danger' ? colors.danger : colors.forest} /> : null}
    <Text style={textStyle}>{label}</Text>
  </Pressable>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <View style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name="file-tray-outline" size={25} color={colors.muted} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.bodyText}>{copy}</Text></View>;
}

function ProfileInfo({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.profileInfo, last && { borderBottomWidth: 0 }]}><Text style={styles.profileLabel}>{label}</Text><Text style={styles.profileValue}>{value}</Text></View>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas, padding: 24 },
  loadingText: { color: colors.muted, marginTop: 12, fontSize: 14 },
  loginRoot: { flex: 1, backgroundColor: colors.canvas },
  loginContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 48, paddingBottom: 28 },
  loginBrand: { alignItems: 'center', marginBottom: 28 },
  logoMark: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest, marginBottom: 12 },
  brandName: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: 0.2 },
  brandTagline: { color: colors.muted, fontSize: 14, marginTop: 5 },
  loginCard: { backgroundColor: colors.white, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: colors.line },
  heading: { fontSize: 23, fontWeight: '800', color: colors.ink },
  bodyText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  demoBox: { marginTop: 18, padding: 13, borderRadius: 13, backgroundColor: colors.canvas },
  demoTitle: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  demoText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  demoAccounts: { flexDirection: 'row', gap: 8, marginVertical: 7 },
  demoAccountButton: { flex: 1, minHeight: 38, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  demoAccountText: { color: colors.forest, fontSize: 12, fontWeight: '700' },
  loginFootnote: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 20 },
  authPrompt: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 18 },
  authPromptText: { color: colors.muted, fontSize: 12 },
  authPromptLink: { color: colors.forest, fontSize: 12, fontWeight: '800' },
  successText: { color: colors.forest, fontSize: 12, lineHeight: 18, marginTop: 8 },
  screen: { flex: 1, backgroundColor: colors.canvas },
  screenContent: { padding: 18, paddingBottom: 34 },
  heroCard: { backgroundColor: colors.forest, borderRadius: 23, padding: 20, overflow: 'hidden' },
  eyebrow: { color: '#C4E5D4', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  heroTitle: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 11 },
  heroCopy: { color: '#D1E2DA', fontSize: 13, marginTop: 5 },
  heroBottom: { borderTopColor: 'rgba(255,255,255,0.18)', borderTopWidth: 1, marginTop: 20, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroMetricLabel: { color: '#C4E5D4', fontSize: 11 },
  heroMetric: { color: colors.white, fontSize: 19, fontWeight: '800', marginTop: 3 },
  statRow: { flexDirection: 'row', gap: 11, marginTop: 13 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 17, padding: 14, borderColor: colors.line, borderWidth: 1 },
  statIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.forestLight, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  statValue: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 23, marginBottom: 10 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  sectionCaption: { color: colors.muted, fontSize: 11 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: { width: '48%', minHeight: 113, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 17, padding: 13, position: 'relative' },
  quickIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.forestLight, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  quickTitle: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  quickSubtitle: { color: colors.muted, fontSize: 10, marginTop: 3 },
  quickArrow: { position: 'absolute', right: 13, top: 20 },
  inventoryNote: { color: colors.muted, fontSize: 11, marginTop: 13, textAlign: 'right' },
  pageHeading: { marginBottom: 17 },
  pageTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', marginBottom: 5 },
  fieldWrap: { marginTop: 13 },
  fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  inputShell: { minHeight: 47, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.white, paddingHorizontal: 13 },
  textInput: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 11 },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18, marginTop: 8 },
  buttonBase: { minHeight: 45, paddingHorizontal: 14, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  button: { backgroundColor: colors.forest },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  secondaryButton: { backgroundColor: colors.forestLight, borderWidth: 1, borderColor: '#D4E4DA' },
  secondaryButtonText: { color: colors.forest, fontWeight: '700', fontSize: 12 },
  dangerButton: { backgroundColor: colors.paleRed, borderWidth: 1, borderColor: '#F1D1CE' },
  dangerButtonText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
  disabledButton: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  resultCount: { color: colors.muted, fontSize: 12, marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 15 },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  productRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 9 },
  productRowCompact: { flex: 1, minHeight: 58, borderWidth: 0, paddingHorizontal: 0, paddingVertical: 3, marginBottom: 0 },
  productIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forestLight },
  productTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  productName: { color: colors.ink, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  productMeta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  productPrice: { color: colors.forest, fontSize: 12, fontWeight: '800', marginLeft: 4 },
  inputColumns: { flexDirection: 'row', gap: 10 },
  featuredToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, paddingVertical: 3 },
  featuredToggleText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  formButtons: { flexDirection: 'row', gap: 8, marginTop: 15 },
  manageProductCard: { marginBottom: 1 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: -4, marginBottom: 10 },
  emptyState: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 18, alignItems: 'center', padding: 24, marginTop: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  cartProductRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 15, paddingHorizontal: 11, marginTop: 8 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  quantityButton: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.forestLight, alignItems: 'center', justifyContent: 'center' },
  quantityText: { color: colors.ink, fontSize: 13, fontWeight: '700', minWidth: 13, textAlign: 'center' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  totalValue: { color: colors.forest, fontSize: 16, fontWeight: '800' },
  mutedSmall: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  transactionTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  deleteTransaction: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 10 },
  deleteTransactionText: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 },
  userAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.forestLight, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: colors.forest, fontSize: 17, fontWeight: '800' },
  statusText: { fontSize: 10, fontWeight: '700', marginTop: 3 },
  userStatusButton: { backgroundColor: colors.paleRed, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  userStatusButtonActive: { backgroundColor: colors.forestLight },
  userStatusButtonText: { color: colors.danger, fontSize: 10, fontWeight: '700' },
  roleSelector: { flexDirection: 'row', gap: 9 },
  roleOption: { borderWidth: 1, borderColor: colors.line, borderRadius: 11, paddingHorizontal: 18, paddingVertical: 9, backgroundColor: colors.white },
  roleOptionActive: { borderColor: colors.forest, backgroundColor: colors.forestLight },
  roleOptionText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  roleOptionTextActive: { color: colors.forest },
  profileCard: { alignItems: 'center', paddingVertical: 25, marginBottom: 12 },
  profileAvatar: { width: 76, height: 76, borderRadius: 25, backgroundColor: colors.forestLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileAvatarText: { color: colors.forest, fontSize: 30, fontWeight: '800' },
  profileName: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  roleBadge: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 11, paddingVertical: 7, backgroundColor: colors.forestLight, borderRadius: 20, marginTop: 12 },
  roleBadgeText: { color: colors.forest, fontSize: 11, fontWeight: '700' },
  profileInfo: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  profileLabel: { color: colors.muted, fontSize: 10, marginBottom: 4 },
  profileValue: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  profileNote: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 16, paddingHorizontal: 14 },
  drawerContent: { flexGrow: 1 },
  drawerBrand: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 18, paddingVertical: 20, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  drawerAvatar: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  drawerAvatarText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  drawerUserName: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  drawerRole: { color: colors.muted, fontSize: 10, marginTop: 4 },
  drawerFooter: { marginTop: 'auto', paddingHorizontal: 18, paddingBottom: 16 },
  drawerDivider: { height: 1, backgroundColor: colors.line, marginBottom: 11 },
  logoutRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  logoutText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  drawerVersion: { color: '#A2ACA6', fontSize: 9, letterSpacing: 1, marginTop: 13 },
});
