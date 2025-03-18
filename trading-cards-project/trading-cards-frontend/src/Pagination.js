import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // If current page is more than 3, add ellipsis after first page
    if (currentPage > 3) {
      pageNumbers.push('...');
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pageNumbers.push(i);
    }
    
    // If current page is less than totalPages - 2, add ellipsis before last page
    if (currentPage < totalPages - 2) {
      pageNumbers.push('...');
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  // Don't render pagination if only one page
  if (totalPages <= 1) return null;
  
  return (
    <div className="pagination">
      <button 
        className="pagination-arrow"
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
      >
        &laquo; Prev
      </button>
      
      <div className="pagination-numbers">
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
          ) : (
            <button
              key={page}
              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      <button 
        className="pagination-arrow"
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
      >
        Next &raquo;
      </button>
    </div>
  );
};

export default Pagination;