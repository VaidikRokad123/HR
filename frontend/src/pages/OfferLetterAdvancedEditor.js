import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '../utils/safeHtml';
import './OfferLetterAdvancedEditor.css';

const PAGE_PACKING_LIMIT_MM = 218;
const PX_PER_MM = 96 / 25.4;

function OfferLetterAdvancedEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState(location.state?.pdfUrl || '');
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef(null);
  const textareaRefs = useRef({});
  const lastFocusedTextarea = useRef(null);
  const measurementRootRef = useRef(null);

  const stripHtml = (text = '') => String(text).replace(/<[^>]*>/g, '');
  const resolveVariables = (text = '') => String(text).replace(/\$\{([^}]+)\}/g, (_, key) => metadata?.[key] ?? '');

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const renumberPages = (pageList) => pageList.map((page, index) => ({ ...page, pageNumber: index + 1 }));

  const estimateHeightMm = (paragraphs = []) => {
    const root = measurementRootRef.current;
    if (!root) {
      return paragraphs.reduce((total, para) => total + Math.max(10, Math.ceil(stripHtml(para.content).length / 78) * 6), 0);
    }

    root.innerHTML = '';
    const pageEl = document.createElement('div');
    pageEl.style.width = '210mm';
    pageEl.style.fontFamily = 'Arial, sans-serif';
    pageEl.style.fontSize = '11pt';
    pageEl.style.lineHeight = '1.5';
    const contentEl = document.createElement('div');
    contentEl.style.padding = '45mm 25mm 34mm';
    pageEl.appendChild(contentEl);
    root.appendChild(pageEl);

    paragraphs.forEach((para) => {
      const el = document.createElement('div');
      const safeHtml = sanitizeHtml(resolveVariables(para.content || ''));
      if (para.type === 'image') {
        el.style.height = '65mm';
      } else if (para.type === 'date') {
        el.textContent = stripHtml(safeHtml);
        el.style.textAlign = 'right';
        el.style.marginBottom = '6mm';
      } else {
        el.innerHTML = safeHtml;
        el.style.marginBottom = para.type === 'signature' ? '8mm' : '4mm';
      }
      contentEl.appendChild(el);
    });

    return contentEl.getBoundingClientRect().height / PX_PER_MM;
  };

  const loadDraft = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (Array.isArray(location.state?.pages)) {
        setPages(location.state.pages);
        setMetadata(location.state.metadata || {});
        return;
      }

      const response = await axios.get('/documents/draft');
      setPages(response.data.data.pages || []);
      setMetadata(response.data.data.metadata || {});
    } catch (err) {
      setError('Failed to load document draft. Please prepare a document first.');
    } finally {
      setLoading(false);
    }
  }, [location.state]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const currentPage = pages[currentPageIndex] || { paragraphs: [] };

  const updatePages = (updater) => {
    setPages((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return renumberPages(next);
    });
  };

  const addPage = () => {
    updatePages([...pages, { pageNumber: pages.length + 1, paragraphs: [{ id: `p${Date.now()}`, content: '', type: 'paragraph' }] }]);
    setCurrentPageIndex(pages.length);
    showNotice('Page added');
  };

  const deletePage = (index) => {
    if (pages.length === 1) {
      showNotice('Cannot delete the last page');
      return;
    }
    updatePages(pages.filter((_, itemIndex) => itemIndex !== index));
    setCurrentPageIndex((current) => Math.max(0, Math.min(current, pages.length - 2)));
  };

  const addParagraph = () => {
    updatePages((current) => current.map((page, index) => (
      index === currentPageIndex
        ? { ...page, paragraphs: [...page.paragraphs, { id: `p${Date.now()}`, content: '', type: 'paragraph' }] }
        : page
    )));
  };

  const updateParagraph = (paragraphIndex, value) => {
    updatePages((current) => current.map((page, pageIndex) => {
      if (pageIndex !== currentPageIndex) return page;
      const paragraphs = page.paragraphs.map((para, index) => index === paragraphIndex ? { ...para, content: value } : para);
      return { ...page, paragraphs };
    }));
  };

  const updateParagraphType = (paragraphIndex, type) => {
    updatePages((current) => current.map((page, pageIndex) => {
      if (pageIndex !== currentPageIndex) return page;
      const paragraphs = page.paragraphs.map((para, index) => index === paragraphIndex ? { ...para, type } : para);
      return { ...page, paragraphs };
    }));
  };

  const deleteParagraph = (paragraphIndex) => {
    if (currentPage.paragraphs.length === 1) {
      showNotice('Cannot delete the last paragraph');
      return;
    }
    updatePages((current) => current.map((page, pageIndex) => (
      pageIndex === currentPageIndex
        ? { ...page, paragraphs: page.paragraphs.filter((_, index) => index !== paragraphIndex) }
        : page
    )));
  };

  const moveParagraph = (paragraphIndex, direction) => {
    const target = paragraphIndex + direction;
    if (target < 0 || target >= currentPage.paragraphs.length) return;

    updatePages((current) => current.map((page, pageIndex) => {
      if (pageIndex !== currentPageIndex) return page;
      const paragraphs = [...page.paragraphs];
      [paragraphs[paragraphIndex], paragraphs[target]] = [paragraphs[target], paragraphs[paragraphIndex]];
      return { ...page, paragraphs };
    }));
  };

  const rebalancePages = () => {
    const rebalanced = [];
    let currentParagraphs = [];

    pages.flatMap((page) => page.paragraphs).forEach((paragraph) => {
      const candidate = [...currentParagraphs, paragraph];
      if (estimateHeightMm(candidate) <= PAGE_PACKING_LIMIT_MM || currentParagraphs.length === 0) {
        currentParagraphs = candidate;
      } else {
        rebalanced.push({ paragraphs: currentParagraphs });
        currentParagraphs = [paragraph];
      }
    });

    if (currentParagraphs.length) rebalanced.push({ paragraphs: currentParagraphs });
    updatePages(rebalanced.length ? rebalanced : [{ paragraphs: [{ id: `p${Date.now()}`, content: '', type: 'paragraph' }] }]);
    setCurrentPageIndex(0);
    showNotice('Pages rebalanced');
  };

  const uploadImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updatePages((current) => current.map((page, index) => (
        index === currentPageIndex
          ? { ...page, paragraphs: [...page.paragraphs, { id: `img${Date.now()}`, content: reader.result, type: 'image', alt: file.name }] }
          : page
      )));
    };
    reader.readAsDataURL(file);
  };

  const compilePDF = async () => {
    try {
      setCompiling(true);
      setError('');
      const response = await axios.post('/documents/compile', { pages, metadata });
      setPdfUrl(`${response.data.path}?t=${Date.now()}`);
      showNotice('PDF compiled');
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.message || 'Failed to compile PDF.');
    } finally {
      setCompiling(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfUrl) {
      showNotice('Compile the PDF first');
      return;
    }
    const cleanUrl = pdfUrl.split('?')[0];
    const fileName = cleanUrl.split('/').pop() || 'document.pdf';
    const link = document.createElement('a');
    link.href = cleanUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const placeholder = (name) => ['$', '{', name, '}'].join('');
  const variables = ['name', 'upperName', 'gender', 'internType', 'durationType', 'duration', 'role', 'startDate', 'endDate', 'salaryType', 'salaryAmount', 'date', 'companyName', 'signatoryName'];

  const insertVariable = (name) => {
    const key = lastFocusedTextarea.current;
    if (!key) {
      showNotice('Select a text field first');
      return;
    }

    const [pageIndex, paraIndex] = key.split('-').map(Number);
    if (pageIndex !== currentPageIndex) {
      showNotice('Select a text field on the current page');
      return;
    }

    const textarea = textareaRefs.current[key];
    const currentContent = currentPage.paragraphs[paraIndex].content || '';
    const start = textarea?.selectionStart || currentContent.length;
    const end = textarea?.selectionEnd || currentContent.length;
    const next = `${currentContent.slice(0, start)}${placeholder(name)}${currentContent.slice(end)}`;
    updateParagraph(paraIndex, next);
  };

  if (loading) return <div className="document-editor"><div className="loading">Loading</div></div>;

  if (error && pages.length === 0) {
    return (
      <div className="document-editor">
        <div className="editor-empty">
          <h2>Document draft unavailable</h2>
          <p>{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/documents')}>Back to Documents</button>
        </div>
      </div>
    );
  }

  const currentHeight = estimateHeightMm(currentPage.paragraphs);
  const capacity = Math.round((currentHeight / PAGE_PACKING_LIMIT_MM) * 100);

  return (
    <div className="document-editor">
      {notice && <div className="document-editor-notice">{notice}</div>}
      <header className="document-editor-header">
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/documents')}>Back</button>
        <div>
          <h1>Advanced Document Editor</h1>
          <p>{metadata.name || 'Prepared document'}</p>
        </div>
        <div className="document-editor-actions">
          <button type="button" className="btn btn-primary" onClick={compilePDF} disabled={compiling}>
            {compiling ? 'Compiling...' : 'Compile PDF'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={downloadPDF} disabled={!pdfUrl}>Open PDF</button>
        </div>
      </header>

      {error && <div className="alert alert-error document-editor-error">{error}</div>}

      <div className="document-editor-grid">
        <aside className="editor-panel">
          <section>
            <h3>Pages</h3>
            <button type="button" className="btn btn-secondary editor-full-btn" onClick={addPage}>Add Page</button>
            <div className="editor-page-list">
              {pages.map((page, index) => (
                <button
                  key={`${page.pageNumber}-${index}`}
                  type="button"
                  className={`editor-page-item ${currentPageIndex === index ? 'editor-page-item--active' : ''}`}
                  onClick={() => setCurrentPageIndex(index)}
                >
                  <span>Page {page.pageNumber}</span>
                  {pages.length > 1 && (
                    <i
                      className="ti ti-x"
                      title="Delete page"
                      onClick={(event) => {
                        event.stopPropagation();
                        deletePage(index);
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3>Tools</h3>
            <button type="button" className="btn btn-secondary editor-full-btn" onClick={addParagraph}>Add Paragraph</button>
            <button type="button" className="btn btn-secondary editor-full-btn" onClick={() => fileInputRef.current?.click()}>Add Image</button>
            <button type="button" className="btn btn-secondary editor-full-btn" onClick={rebalancePages}>Rebalance</button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadImage} hidden />
          </section>

          <section>
            <h3>Variables</h3>
            <div className="editor-variable-list">
              {variables.map((name) => (
                <button key={name} type="button" onClick={() => insertVariable(name)}>{name}</button>
              ))}
            </div>
          </section>
        </aside>

        <main className="editor-workspace">
          <div className="editor-workspace-header">
            <div>
              <h2>Page {currentPage.pageNumber}</h2>
              <p>{currentPage.paragraphs.length} block(s)</p>
            </div>
            <div className={`editor-capacity ${capacity > 100 ? 'editor-capacity--overflow' : ''}`}>
              <span>{capacity}% full</span>
              <div><b style={{ width: `${Math.min(100, capacity)}%` }} /></div>
            </div>
          </div>

          <div className="editor-blocks">
            {currentPage.paragraphs.map((paragraph, index) => (
              <div key={paragraph.id || index} className="editor-block">
                <div className="editor-block-header">
                  <div>
                    <strong>{paragraph.type || 'paragraph'} #{index + 1}</strong>
                    {paragraph.type !== 'image' && (
                      <select value={paragraph.type || 'paragraph'} onChange={(event) => updateParagraphType(index, event.target.value)}>
                        <option value="date">Date</option>
                        <option value="to">To</option>
                        <option value="subject">Subject</option>
                        <option value="paragraph">Paragraph</option>
                        <option value="signature">Signature</option>
                        <option value="company">Company</option>
                        <option value="separator">Separator</option>
                        <option value="footer">Footer</option>
                      </select>
                    )}
                  </div>
                  <div className="editor-block-actions">
                    <button type="button" className="btn-icon" onClick={() => moveParagraph(index, -1)} disabled={index === 0} title="Move up"><i className="ti ti-arrow-up" /></button>
                    <button type="button" className="btn-icon" onClick={() => moveParagraph(index, 1)} disabled={index === currentPage.paragraphs.length - 1} title="Move down"><i className="ti ti-arrow-down" /></button>
                    <button type="button" className="btn-icon" onClick={() => deleteParagraph(index)} title="Delete"><i className="ti ti-trash" /></button>
                  </div>
                </div>
                {paragraph.type === 'image' ? (
                  <div className="editor-image-preview"><img src={paragraph.content} alt={paragraph.alt || 'Uploaded'} /></div>
                ) : (
                  <textarea
                    ref={(element) => { textareaRefs.current[`${currentPageIndex}-${index}`] = element; }}
                    value={paragraph.content}
                    onChange={(event) => updateParagraph(index, event.target.value)}
                    onFocus={() => { lastFocusedTextarea.current = `${currentPageIndex}-${index}`; }}
                    rows={5}
                  />
                )}
              </div>
            ))}
          </div>
        </main>

        <aside className="editor-preview">
          <h3>PDF Preview</h3>
          {pdfUrl ? <iframe src={pdfUrl} title="Document PDF preview" /> : <div className="editor-preview-empty">Compile PDF to preview</div>}
        </aside>
      </div>

      <div ref={measurementRootRef} className="editor-measure-root" />
    </div>
  );
}

export default OfferLetterAdvancedEditor;
