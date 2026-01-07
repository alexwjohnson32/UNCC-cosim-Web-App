import { useState } from 'react';
import Navbar from './components/Navbar';
import Page from './components/pages/Page';
import ComponentsPage from './components/pages/components/ComponentsPage';
import SimulationPage from './components/pages/components/SimulationPage';
import DashboardPage from './components/pages/components/DashboardPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard');

  const pages = {
    'Dashboard': {
      page: <DashboardPage />
    },
    'Components': {
      page: <ComponentsPage />
    },
    'Simulation': {
      page: <SimulationPage />
    },
    'Tools': {
      page: <Page metadata={'Tools'} />
    }
  }

  return (
    <div className='flex h-screen'>
      <Navbar pageList={Object.keys(pages)} currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className='flex flex-col h-full w-full p-8 overflow-hidden'>
        {pages[currentPage].page}
      </div>
    </div>
  );

}