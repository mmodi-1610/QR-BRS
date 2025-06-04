'use client'
import { CalendarHeart, Menu } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
// import { useLocation } from "wouter";
import Link from 'next/link';
import { Home, Calendar, PlusCircle, Download, Printer, Settings, ChevronRight, Building, Edit, Filter } from "lucide-react";

function Sidebar_new(){
  const username=localStorage.getItem("username")
    // const NavItem = ({ href, icon, children, isActive }) => {
    //     return (
    //       <Link href={href} legacyBehavior >
    //         <a className={`nav-link py-2 px-3 mb-1 rounded d-flex align-items-center ${isActive ? 'active bg-primary text-white' : 'text-dark'}`}>
    //           {icon}
    //           <span className="ms-3">{children}</span>
    //           {isActive && <ChevronRight className="ms-auto" size={16} />}
    //         </a>
    //       </Link>
    //     );
    //   };
    const NavItem = ({ href, icon, children, isActive }) => {
  return (
    <Link href={href} className={`nav-link py-2 px-3 mb-1 rounded d-flex align-items-center ${isActive ? 'active bg-primary text-white' : 'text-dark'}`}>
      {icon}
      <span className="ms-3">{children}</span>
      {isActive && <ChevronRight className="ms-auto" size={16} />}
    </Link>
  );
};
        
return (
    <>
    <button className="btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasWithBothOptions" aria-controls="offcanvasWithBothOptions"><Menu size={20}/></button>

    <div className="offcanvas offcanvas-start" data-bs-scroll="true" tabIndex="-1" id="offcanvasWithBothOptions" aria-labelledby="offcanvasWithBothOptionsLabel">
    <div className="offcanvas-header">
            <div className="h-100 d-flex flex-column" >
            <div className="p-3 border-bottom">
                <div className="d-flex align-items-center flex-grow-1" style={{background:'light'}}>
                <Calendar className="text-primary" size={32} />
                <div className="ms-3 ">
                    <h5 className="fw-bold mb-0">Restaurant</h5>
                    <p className="mb-0 text-muted small">Management System</p>
                </div>
                </div>
            </div>
            </div>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div className="offcanvas-body">
    <div className="p-3 flex-grow-1">
        <p className="text-uppercase text-muted small fw-bold mb-2">Main Menu</p>
        
        <nav className="nav flex-column">
          <NavItem 
            href="/adminDashboard" 
            icon={<Home size={18} />} 
            // isActive={location === '/'}
          >
            Dashboard
          </NavItem>
          
          <NavItem 
            href="/menuBuilder"
            icon={<PlusCircle size={18} />} 
            // isActive={location.startsWith('/create')}
          >
            Menu Builder
          </NavItem>
          
          <NavItem 
            href="/QRGenerator" 
            icon={<Edit size={18} />} 
            // isActive={location === '/all-timetables'}
          >
            QR Generator
          </NavItem>
          
          <NavItem 
            href="/orderManagement" 
            icon={<Calendar size={18} />} 
            // isActive={location === '/export'}
          >
            Order Management
          </NavItem>
          

          {/* <NavItem 
            href="/print" 
            icon={<Printer size={18} />} 
            // isActive={location === '/print'}
          >
            Print Timetable
          </NavItem> */}
        </nav>
        
        {/* <p className="text-uppercase text-muted small fw-bold mb-2 mt-4">Administration</p>
        
        <nav className="nav flex-column">
          <NavItem 
            href="/departments" 
            icon={<Building size={18} />} 
            // isActive={location === '/departments'}
          >
            Departments
          </NavItem>
          
          <NavItem 
            href="/settings" 
            icon={<Settings size={18} />} 
            // isActive={location === '/settings'}
          >
            Settings
          </NavItem>
        </nav>*/}
      </div>
      
      <div className="p-3 border-top">
        <div className="d-flex align-items-center">
          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
               style={{ width: '32px', height: '32px' }}>
            {username[0].toUpperCase()}
          </div>
          <div className="ms-3">
            <p className="mb-0 fw-medium">{username}</p>
            <p className="mb-0 text-muted small">Administrator</p>
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
)

};
export default Sidebar_new