import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDqMK7AZaRQyr6DvQwxOxuNJ7wtMxpoex8",
  authDomain: "pickpackpromx.firebaseapp.com",
  projectId: "pickpackpromx",
  storageBucket: "pickpackpromx.firebasestorage.app",
  messagingSenderId: "1072798208281",
  appId: "1:1072798208281:web:b818b9db86bd881430f588"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateSuppliers() {
  try {
    console.log('🔥 Starting supplier migration...');
    
    const suppliersRef = collection(db, 'suppliers');
    const querySnapshot = await getDocs(suppliersRef);
    
    console.log(`📦 Found ${querySnapshot.docs.length} suppliers to migrate`);
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const docRef = doc(db, 'suppliers', docSnapshot.id);
      
      console.log(`📄 Migrating supplier: ${docSnapshot.id}`);
      console.log('📄 Current data:', data);
      
      // Check if already migrated (has marca field)
      if (data.marca) {
        console.log('✅ Already migrated, skipping');
        continue;
      }
      
      // Migrate to new format
      const updateData = {
        marca: data.name || '',
        dueno_proveedor_principal: data.contactPerson || '',
        pais_grupo_corporativo: data.country || '',
        created_at: data.createdAt || new Date(),
        updated_at: new Date()
      };
      
      console.log('📦 Update data:', updateData);
      
      await updateDoc(docRef, updateData);
      console.log('✅ Migrated successfully');
    }
    
    console.log('🎉 Migration completed!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

migrateSuppliers();
