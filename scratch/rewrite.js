const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/EmployeeDetail.js', 'utf8');

// Replace TABS
code = code.replace(
  /const TABS = \[\s*\{ id: "personal"[^\]]*\];/s,
  `const TABS = [
  { id: "identity", label: "Basic Identity" },
  { id: "contact", label: "Contact" },
  { id: "government_id", label: "Government ID" },
  { id: "education", label: "Education" },
  { id: "employment", label: "Employment" },
  { id: "payroll", label: "Payroll" },
  { id: "documents", label: "Documents" },
];`
);

code = code.replace(
  /const MISSING_SECTION_TARGETS = \{[^}]*\};/s,
  `const MISSING_SECTION_TARGETS = {
  Personal: { tab: "identity", edit: "identity" },
  Contact: { tab: "contact", edit: "contact" },
  "Government ID": { tab: "government_id", edit: "government_id" },
  Education: { tab: "education", edit: "education" },
  Employment: { tab: "employment", edit: "employment" },
  Payroll: { tab: "payroll", edit: "payroll" },
};`
);

code = code.replace(
  /const \[activeTab, setActiveTab\] = useState\("personal"\);/,
  `const [activeTab, setActiveTab] = useState("identity");`
);

code = code.replace(
  /setEmployeeData\(data\);\s*setFormData\(data\);\s*setSensitiveDetails\(\{ bank: null, payroll: null, unlocked: false \}\);/s,
  `setEmployeeData(data);
      setFormData(data);
      setEditWizardDraft(buildEditDraft(data));
      setSensitiveDetails({ bank: null, payroll: null, unlocked: false });`
);

code = code.replace(
  /setSensitiveDetails\(unlocked\);\s*setEmployeeData\(\(prev\) => \(\{\s*\.\.\.prev,\s*bank: unlocked\.bank,\s*payroll: unlocked\.payroll,\s*sensitiveDetailsLocked: false,\s*\}\)\);\s*setFormData\(\(prev\) => \(\{/s,
  `setSensitiveDetails(unlocked);
      setEmployeeData((prev) => {
        const next = {
          ...prev,
          bank: unlocked.bank,
          payroll: unlocked.payroll,
          sensitiveDetailsLocked: false,
        };
        setEditWizardDraft(buildEditDraft(next));
        return next;
      });
      setFormData((prev) => ({`
);

// Delete renderPersonalTab, renderEmployeeTab, renderPayrollTab, renderPayrollHistoryTab
code = code.replace(
  /const renderPersonalTab = \(\) => \(.*?const renderEditWizardStep = \(\) => \{/s,
  `const renderEditWizardStep = () => {`
);

const replacementRenderTabContent = `
  const renderTabContent = () => {
    if (!editWizardDraft) return null;
    const currentStep = EDIT_STEPS.find(s => s.id === activeTab);
    const stepIndex = EDIT_STEP_INDEX[activeTab];

    if (
      (activeTab === "payroll" || activeTab === "government_id") &&
      !sensitiveDetails.unlocked
    ) {
      return (
        <div className="ed-tab-content" style={{ marginTop: 24 }}>
          {renderSensitiveGate(
            currentStep.label,
            \`\${currentStep.label} details are protected\`
          )}
        </div>
      );
    }

    const isEditing = editMode === activeTab;
    
    return (
      <div className="ed-tab-content" style={{ marginTop: 24 }}>
        <DetailCard
          title={currentStep.label}
          canEdit={true}
          isEditing={isEditing}
          onEdit={() => {
            setEditMode(activeTab);
            setEditWizardStep(stepIndex);
          }}
          onSave={async () => {
            await saveEditWizardStep(false);
            setEditMode(null);
          }}
          onCancel={() => {
            setEditMode(null);
            setEditWizardDraft(buildEditDraft(employeeData));
          }}
        >
          <fieldset disabled={!isEditing} style={{ border: "none", padding: 0, margin: 0 }}>
            {renderEditWizardStep()}
          </fieldset>
          
          {activeTab === "documents" && (
            <div style={{ marginTop: 24 }}>
              <h4 className="ed-subsection-title">Uploaded documents</h4>
              {documentsLoading ? (
                <div className="ed-empty-tab">Loading uploaded documents...</div>
              ) : documentsError ? (
                <div className="alert alert-error">{documentsError}</div>
              ) : employeeDocuments.length > 0 ? (
                <div className="ed-documents-list">
                  {employeeDocuments.map((document) => (
                    <a
                      key={document._id}
                      className="ed-document-item"
                      href={getDocumentUrl(document)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="ed-document-item__icon">
                        <i className="ti ti-file" aria-hidden="true" />
                      </span>
                      <span className="ed-document-item__body">
                        <strong>{document.fileName}</strong>
                        <small>
                          {document.category?.replaceAll("_", " ") || "Document"} · {formatDate(document.uploadedAt || document.createdAt)}
                        </small>
                      </span>
                      <span className="ed-document-item__action">Open</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="ed-empty-tab">No uploaded documents found for this employee.</div>
              )}
            </div>
          )}
        </DetailCard>
      </div>
    );
  };
`;

code = code.replace(/const renderTabContent = \(\) => \{.*?(?=return \()/s, replacementRenderTabContent + '\n  ');

code = code.replace(/<button[^>]*onClick=\{\(\) => openEditWizard\(0\)\}[^>]*>.*?<\/button>/s, '');

code = code.replace(/\{editWizardOpen && editWizardDraft && \(.*?\}\)\s*<\/div>\s*\);\s*\};\s*export default EmployeeDetail;/s, '</div>\n  );\n};\n\nexport default EmployeeDetail;');

code = code.replace(
  /onClick=\{\(\) => \{\s*setActiveTab\(tab\.id\);\s*if \(editMode\) cancelEdit\(\);\s*\}\}/g,
  `onClick={() => {
                setActiveTab(tab.id);
                setEditWizardStep(EDIT_STEP_INDEX[tab.id]);
                if (editMode) cancelEdit();
              }}`
);

// One thing to ensure: when editing documents tab, we want to hide the file inputs when NOT editing? No, it's fine if they are visible but disabled.
// Wait, the original had input type="file" without showing the selected file if disabled. 
// But we're just wrapping in a disabled fieldset.

fs.writeFileSync('frontend/src/pages/EmployeeDetail.js', code);
console.log('Success');
