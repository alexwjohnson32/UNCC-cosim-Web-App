import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Page from './components/pages/Page';
import ComponentsPage from './components/pages/components/ComponentsPage';

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
      page: <Page metadata={'Simulation'} />
    },
    'Tools': {
      page: <Page metadata={'Tools'} />
    }
  }

  return (
    <>
      <Navbar pageList={Object.keys(pages)} currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className='page-container'>
        {pages[currentPage].page}
      </div>
    </>
  );

}