import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/Customers/CustomerList';
import CustomerForm from './pages/Customers/CustomerForm';
import CustomerDetail from './pages/Customers/CustomerDetail';
import ProductList from './pages/Products/ProductList';
import ProductForm from './pages/Products/ProductForm';
import ProductDetail from './pages/Products/ProductDetail';
import ChallanList from './pages/Challans/ChallanList';
import ChallanForm from './pages/Challans/ChallanForm';
import ChallanDetail from './pages/Challans/ChallanDetail';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />

            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']} />}>
              <Route path="/customers/new" element={<CustomerForm />} />
              <Route path="/customers/:id/edit" element={<CustomerForm />} />
            </Route>

            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']} />}>
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/:id/edit" element={<ProductForm />} />
            </Route>

            <Route path="/challans" element={<ChallanList />} />
            <Route path="/challans/:id" element={<ChallanDetail />} />
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']} />}>
              <Route path="/challans/new" element={<ChallanForm />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
