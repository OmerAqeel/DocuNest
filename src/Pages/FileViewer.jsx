const FileViewer = ({ fileUrl, fileType }) => {
    const isPDF = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');
  
    const [numPages, setNumPages] = useState(null); // To store number of pages for PDFs
  
    const onLoadSuccess = ({ numPages }) => {
      setNumPages(numPages); // Set the total number of pages
    };
  
    if (isPDF) {
      return (
        <div className="pdf-container" style={{ width: '100%', height: '600px', overflow: 'auto' }}>
          <Document file={fileUrl} onLoadSuccess={onLoadSuccess}>
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={index} pageNumber={index + 1} />
            ))}
          </Document>
        </div>
      );
    }
  
    if (isImage) {
      return <img src={fileUrl} alt="Preview" style={{ maxWidth: '100%' }} />;
    }
  
    return (
      <iframe 
        src={fileUrl}
        title="File Preview"
        width="100%"
        height="600px"
        style={{ border: 'none' }}
      />
    );
  };
  
  