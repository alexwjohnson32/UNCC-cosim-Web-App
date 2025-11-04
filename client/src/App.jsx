import { useState } from 'react';
import Navbar from './components/Navbar';
import Page from './components/pages/Page';
import ComponentsPage from './components/pages/components/ComponentsPage';
import SimulationPage from './components/pages/components/SimulationPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('Components');

  const pages = {
    'Dashboard': {
      page: <Page metadata={'Dashboard'} />
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