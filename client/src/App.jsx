import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Page from './components/pages/Page';

export default function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard');

  const pageList = ['Dashboard', 'Components', 'Simulation', 'Tools'];

  return (
    <>
      <Navbar pageList={pageList} currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className='page-container'>
        <Page metadata={currentPage} />
      </div>
    </>
  );

}