import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Plane, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

interface Airline {
  id: string;
  name: string;
  logo: string;
  country: string;
  iata_code: string;
  icao_code: string;
  website: string;
  createdAt: any;
}

export default function Airlines() {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [filteredAirlines, setFilteredAirlines] = useState<Airline[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newAirline, setNewAirline] = useState({
    name: '',
    country: '',
    iata_code: '',
    icao_code: '',
    website: '',
    logo: null as File | null
  });

  // Cargar aerolíneas desde Firebase
  useEffect(() => {
    const loadAirlines = async () => {
      try {
        console.log('🔥 Loading airlines from Firebase...');
        const airlinesRef = collection(db, 'airlines');
        const querySnapshot = await getDocs(airlinesRef);
        
        if (querySnapshot.empty) {
          setAirlines([]);
          setFilteredAirlines([]);
          return;
        }
        
        const airlinesData: Airline[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          airlinesData.push({
            id: doc.id,
            name: data.name || '',
            logo: data.logo || '',
            country: data.country || '',
            iata_code: data.iata_code || '',
            icao_code: data.icao_code || '',
            website: data.website || '',
            createdAt: data.created_at || new Date()
          });
        });
        
        console.log('✅ Airlines loaded:', airlinesData.length);
        setAirlines(airlinesData);
        setFilteredAirlines(airlinesData);
      } catch (error) {
        console.error('Error loading airlines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAirlines();
  }, []);

  // Filtrar aerolíneas por término de búsqueda
  useEffect(() => {
    const filtered = airlines.filter(airline =>
      (airline.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (airline.country || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (airline.iata_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (airline.icao_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAirlines(filtered);
  }, [searchTerm, airlines]);

  // Crear nueva aerolínea
  const handleCreateAirline = async () => {
    try {
      console.log('🔥 Creating airline with data:', newAirline);
      setIsUploading(true);
      
      let logoUrl = '';
      
      // Subir logo a Firebase Storage si existe
      if (newAirline.logo) {
        console.log('📤 Uploading logo to Firebase Storage...');
        const storage = getStorage();
        const logoRef = ref(storage, `airlines/${Date.now()}_${newAirline.logo.name}`);
        const snapshot = await uploadBytes(logoRef, newAirline.logo);
        logoUrl = await getDownloadURL(snapshot.ref);
        console.log('✅ Logo uploaded:', logoUrl);
      }
      
      const airlinesRef = collection(db, 'airlines');
      const airlineData = {
        name: newAirline.name,
        country: newAirline.country,
        iata_code: newAirline.iata_code.toUpperCase(),
        icao_code: newAirline.icao_code.toUpperCase(),
        website: newAirline.website,
        logo: logoUrl,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      console.log('📦 Airline data to save:', airlineData);
      await addDoc(airlinesRef, airlineData);
      console.log('✅ Airline created successfully');
      
      // Recargar aerolíneas
      const querySnapshot = await getDocs(airlinesRef);
      const airlinesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Airline[];
      
      setAirlines(airlinesData);
      setFilteredAirlines(airlinesData);
      
      // Limpiar formulario
      setNewAirline({
        name: '',
        country: '',
        iata_code: '',
        icao_code: '',
        website: '',
        logo: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('❌ Error creating airline:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading airlines from Firebase...</div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 px-4 lg:px-6 md:gap-6 md:py-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Airlines Management</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Airline
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Airline</DialogTitle>
                      <DialogDescription>
                        Add a new airline to the system with logo and details.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={newAirline.name}
                          onChange={(e) => setNewAirline({...newAirline, name: e.target.value})}
                          className="col-span-3"
                          placeholder="Airline name"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="country" className="text-right">
                          Country
                        </Label>
                        <Input
                          id="country"
                          value={newAirline.country}
                          onChange={(e) => setNewAirline({...newAirline, country: e.target.value})}
                          className="col-span-3"
                          placeholder="Country"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="iata" className="text-right">
                          IATA Code
                        </Label>
                        <Input
                          id="iata"
                          value={newAirline.iata_code}
                          onChange={(e) => setNewAirline({...newAirline, iata_code: e.target.value})}
                          className="col-span-3"
                          placeholder="AA"
                          maxLength={3}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="icao" className="text-right">
                          ICAO Code
                        </Label>
                        <Input
                          id="icao"
                          value={newAirline.icao_code}
                          onChange={(e) => setNewAirline({...newAirline, icao_code: e.target.value})}
                          className="col-span-3"
                          placeholder="AAL"
                          maxLength={4}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="website" className="text-right">
                          Website
                        </Label>
                        <Input
                          id="website"
                          value={newAirline.website}
                          onChange={(e) => setNewAirline({...newAirline, website: e.target.value})}
                          className="col-span-3"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="logo" className="text-right">
                          Logo
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setNewAirline({...newAirline, logo: e.target.files?.[0] || null})}
                            className="cursor-pointer"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Upload airline logo (PNG, JPG, SVG)
                            {isUploading && newAirline.logo && (
                              <span className="text-blue-600 font-medium"> - Uploading...</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateAirline} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Create Airline'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search airlines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Airlines</CardTitle>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{airlines.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Countries</CardTitle>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Set(airlines.map(a => a.country).filter(Boolean)).size}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">With Logos</CardTitle>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {airlines.filter(a => a.logo).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">With Websites</CardTitle>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {airlines.filter(a => a.website).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Aerolíneas */}
              {filteredAirlines.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                  <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No airlines found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms' : 'No airlines in the database'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border">
                  <div className="px-6 py-3 border-b bg-gray-50">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500">
                      <div>Logo</div>
                      <div>Name</div>
                      <div>Country</div>
                      <div>Codes</div>
                      <div>Website</div>
                      <div>Actions</div>
                    </div>
                  </div>
                  <div className="divide-y">
                    {filteredAirlines.map((airline) => (
                      <div key={airline.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          <div className="flex items-center">
                            {airline.logo ? (
                              <img 
                                src={airline.logo} 
                                alt={`${airline.name} logo`}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                                <Plane className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="font-medium">{airline.name || 'No name'}</div>
                          <div className="text-sm text-gray-600">{airline.country || 'No country'}</div>
                          <div className="text-sm">
                            <div className="font-mono text-xs">
                              {airline.iata_code && <span className="bg-blue-100 text-blue-800 px-1 rounded mr-1">{airline.iata_code}</span>}
                              {airline.icao_code && <span className="bg-green-100 text-green-800 px-1 rounded">{airline.icao_code}</span>}
                            </div>
                          </div>
                          <div className="text-sm">
                            {airline.website ? (
                              <a href={airline.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Website
                              </a>
                            ) : (
                              <span className="text-gray-400">No website</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
