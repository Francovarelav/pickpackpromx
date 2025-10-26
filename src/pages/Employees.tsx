import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, User, Edit, Trash2 } from 'lucide-react';
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

interface Employee {
  id: string;
  name: string;
  lastName: string;
  email: string;
  photo: string;
  createdAt: any;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    lastName: '',
    email: '',
    photo: null as File | null
  });

  // Cargar empleados desde Firebase
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        console.log('🔥 Loading employees from Firebase...');
        const employeesRef = collection(db, 'employees');
        const querySnapshot = await getDocs(employeesRef);
        
        if (querySnapshot.empty) {
          setEmployees([]);
          setFilteredEmployees([]);
          return;
        }
        
        const employeesData: Employee[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          employeesData.push({
            id: doc.id,
            name: data.name || '',
            lastName: data.lastName || '',
            email: data.email || '',
            photo: data.photo || '',
            createdAt: data.created_at || new Date()
          });
        });
        
        console.log('✅ Employees loaded:', employeesData.length);
        setEmployees(employeesData);
        setFilteredEmployees(employeesData);
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, []);

  // Filtrar empleados por término de búsqueda
  useEffect(() => {
    const filtered = employees.filter(employee =>
      (employee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  // Crear nuevo empleado
  const handleCreateEmployee = async () => {
    try {
      console.log('🔥 Creating employee with data:', newEmployee);
      setIsUploading(true);
      
      let photoUrl = '';
      
      // Subir foto a Firebase Storage si existe
      if (newEmployee.photo) {
        console.log('📤 Uploading photo to Firebase Storage...');
        const storage = getStorage();
        const photoRef = ref(storage, `employees/${Date.now()}_${newEmployee.photo.name}`);
        const snapshot = await uploadBytes(photoRef, newEmployee.photo);
        photoUrl = await getDownloadURL(snapshot.ref);
        console.log('✅ Photo uploaded:', photoUrl);
      }
      
      const employeesRef = collection(db, 'employees');
      const employeeData = {
        name: newEmployee.name,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        photo: photoUrl,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      console.log('📦 Employee data to save:', employeeData);
      await addDoc(employeesRef, employeeData);
      console.log('✅ Employee created successfully');
      
      // Recargar empleados
      const querySnapshot = await getDocs(employeesRef);
      const employeesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      
      setEmployees(employeesData);
      setFilteredEmployees(employeesData);
      
      // Limpiar formulario
      setNewEmployee({
        name: '',
        lastName: '',
        email: '',
        photo: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('❌ Error creating employee:', error);
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
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 px-4 lg:px-6 md:gap-6 md:py-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading employees from Firebase...</div>
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
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 px-4 lg:px-6 md:gap-6 md:py-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Employees Management</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>
                        Add a new employee to the system with photo and details.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={newEmployee.name}
                          onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                          className="col-span-3"
                          placeholder="First name"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={newEmployee.lastName}
                          onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                          className="col-span-3"
                          placeholder="Last name"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmployee.email}
                          onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                          className="col-span-3"
                          placeholder="employee@company.com"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="photo" className="text-right">
                          Photo
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setNewEmployee({...newEmployee, photo: e.target.files?.[0] || null})}
                            className="cursor-pointer"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Upload employee photo (PNG, JPG, SVG)
                            {isUploading && newEmployee.photo && (
                              <span className="text-blue-600 font-medium"> - Uploading...</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateEmployee} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Create Employee'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{employees.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">With Photos</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {employees.filter(e => e.photo).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">With Emails</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {employees.filter(e => e.email).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Empleados */}
              {filteredEmployees.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No employees found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms' : 'No employees in the database'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border">
                  <div className="px-6 py-3 border-b bg-gray-50">
                    <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-500">
                      <div>Photo</div>
                      <div>Name</div>
                      <div>Email</div>
                      <div>Created</div>
                      <div>Actions</div>
                    </div>
                  </div>
                  <div className="divide-y">
                    {filteredEmployees.map((employee) => (
                      <div key={employee.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          <div className="flex items-center">
                            {employee.photo ? (
                              <img 
                                src={employee.photo} 
                                alt={`${employee.name} ${employee.lastName}`}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="font-medium">
                            {employee.name || 'No name'} {employee.lastName || ''}
                          </div>
                          <div className="text-sm text-gray-600">{employee.email || 'No email'}</div>
                          <div className="text-sm text-gray-500">
                            {employee.createdAt ? new Date(employee.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
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
