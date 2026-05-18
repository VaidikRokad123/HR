/**
 * AddEmployee.js
 *
 * FIX: Step components are NOT defined inside AddEmployee anymore.
 *      All step JSX is rendered inline via renderStep() to prevent
 *      React from remounting components on every keystroke.
 *
 * 6 steps:
 *   0 – Basic Identity
 *   1 – Contact Information
 *   2 – Government ID
 *   3 – Education
 *   4 – Employment      (can be skipped → pendingSections)
 *   5 – Payroll         (can be skipped → pendingSections)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { state_arr, s_a } from "../utils/locationData";
import "./AddEmployee.css";

/* ─── constants ─────────────────────────────────────────────── */
const DRAFT_KEY = "hr_emp_draft_id";
const STEPS = [
  { label: "Basic Identity", icon: "🆔", key: "identity", skippable: true },
  { label: "Contact", icon: "📞", key: "contact", skippable: true },
  { label: "Government ID", icon: "🪪", key: "government_id", skippable: true },
  { label: "Education", icon: "🎓", key: "education", skippable: true },
  { label: "Employment", icon: "🏢", key: "employment", skippable: true },
  { label: "Payroll", icon: "💰", key: "payroll", skippable: true },
];

const EMPTY_EMERGENCY = { name: "", phone: "", relationship: "" };
const EMPTY_REFERENCE = { name: "", phone: "", email: "" };

const INITIAL = {
  emp_code: "",
  fullName: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  religion: "",
  physicallyHandicapped: "",
  personalMobile: "",
  personalEmail: "",
  currentAddress: { street: "", city: "", state: "", pincode: "" },
  sameAsCurrent: false,
  permanentAddress: { street: "", city: "", state: "", pincode: "" },
  aadharNumber: "",
  panNumber: "",
  passportNumber: "",
  drivingLicence: "",
  voterIdNumber: "",
  highestQualification: "",
  graduationYear: "",
  instituteName: "",
  previousEmployer: "",
  dateJoining: "",
  employmentType: "",
  probationMonths: 0,
  confirmationDate: "",
  workLocation: "",
  designation: "",
  department: "",
  reportingManager: "",
  officialEmail: "",
  workMobile: "",
  laptopAssigned: "",
  gross: "",
  ctc: "",
  accountHolderName: "",
  bankNameBranch: "",
  accountNumber: "",
  ifscCode: "",
  pfApplicable: false,
  pfNumber: "",
  uanNumber: "",
  esicApplicable: false,
  esicNumber: "",
  ptApplicable: false,
  ptNumber: "",
  tdsRegime: "",
  form12bb: "",
};

/* ─── helpers (defined OUTSIDE component – safe for hooks) ───── */
function genDraftId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getCities(stateName) {
  const idx = state_arr.indexOf(stateName) + 1;
  if (idx > 0 && s_a[idx])
    return s_a[idx]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
  return [];
}

const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CUR_YEAR - 1999 }, (_, i) => CUR_YEAR - i);

/* Field wrapper – defined at module level so React never remounts it */
function Field({ label, required, error, full, children }) {
  return (
    <div className={`ae-field${full ? " full" : ""}`}>
      <label className="ae-label">
        {label}
        {required ? (
          <span className="req">*</span>
        ) : (
          <span className="opt">optional</span>
        )}
      </label>
      {children}
      {error && <span className="ae-field-error">{error}</span>}
    </div>
  );
}

/* Address block – defined at module level */
function AddressBlock({ prefix, values, onChange, errors }) {
  const [cities, setCities] = useState(() => getCities(values.state || ""));

  const upd = (k, v) => {
    const next = { ...values, [k]: v };
    if (k === "state") {
      next.city = "";
      setCities(getCities(v));
    }
    onChange(next);
  };

  return (
    <div className="ae-grid-2" style={{ gap: 10 }}>
      <div className="ae-field full">
        <label className="ae-label">
          Street <span className="req">*</span>
        </label>
        <input
          value={values.street}
          onChange={(e) => upd("street", e.target.value)}
          className={errors?.[`${prefix}Street`] ? "error" : ""}
          placeholder="Street / Flat No."
        />
        {errors?.[`${prefix}Street`] && (
          <span className="ae-field-error">{errors[`${prefix}Street`]}</span>
        )}
      </div>
      <div className="ae-field">
        <label className="ae-label">
          State <span className="req">*</span>
        </label>
        <select
          value={values.state}
          onChange={(e) => upd("state", e.target.value)}
          className={errors?.[`${prefix}State`] ? "error" : ""}
        >
          <option value="">Select state</option>
          {state_arr.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors?.[`${prefix}State`] && (
          <span className="ae-field-error">{errors[`${prefix}State`]}</span>
        )}
      </div>
      <div className="ae-field">
        <label className="ae-label">
          City <span className="req">*</span>
        </label>
        <select
          value={values.city}
          onChange={(e) => upd("city", e.target.value)}
          className={errors?.[`${prefix}City`] ? "error" : ""}
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors?.[`${prefix}City`] && (
          <span className="ae-field-error">{errors[`${prefix}City`]}</span>
        )}
      </div>
      <div className="ae-field">
        <label className="ae-label">
          Pincode <span className="req">*</span>
        </label>
        <input
          value={values.pincode}
          onChange={(e) => upd("pincode", e.target.value)}
          placeholder="6-digit pincode"
          maxLength={6}
        />
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────── */
const AddEmployee = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [emergency, setEmergency] = useState([{ ...EMPTY_EMERGENCY }]);
  const [refs, setRefs] = useState([{ ...EMPTY_REFERENCE }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState("idle");
  const [draftId, setDraftId] = useState(null);
  const [dialog, setDialog] = useState(false);
  const [refData, setRefData] = useState(null);
  const [pending, setPending] = useState([]); // skipped sections
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const saveTimer = useRef(null);

  /* ── reference data ── */
  useEffect(() => {
    axios
      .get("/admin/ref")
      .then((r) => setRefData(r.data))
      .catch(() => {});
  }, []);

  /* ── on mount: edit mode OR check draft ── */
  useEffect(() => {
    if (editId) {
      axios
        .get(`/admin/employees/${editId}`)
        .then((r) => {
          const e = r.data.employee;
          setForm({
            ...INITIAL,
            ...e,
            currentAddress: e.currentAddress || INITIAL.currentAddress,
            permanentAddress: e.permanentAddress || INITIAL.permanentAddress,
            dob: e.dob ? e.dob.slice(0, 10) : "",
            dateJoining: e.dateJoining ? e.dateJoining.slice(0, 10) : "",
            confirmationDate:
              e.confirmationDate && e.confirmationDate !== ""
                ? e.confirmationDate.slice(0, 10)
                : "",
                 
          });
          if (e.emergencyContacts?.length) setEmergency(e.emergencyContacts);
          if (e.references?.length) setRefs(e.references);
          if (e.pendingSections?.length) setPending(e.pendingSections);
        })
        .catch(() => {});
      return;
    }
    const id = localStorage.getItem(DRAFT_KEY);
    if (id) {
      setDraftId(id);
      setDialog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── auto-save ── */
  const triggerSave = useCallback(
    (f, emg, rf, st) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaving("saving");
      saveTimer.current = setTimeout(async () => {
        try {
          const id = draftId || genDraftId();
          if (!draftId) {
            setDraftId(id);
            localStorage.setItem(DRAFT_KEY, id);
          }
          await axios.post("/admin/drafts", {
            draftId: id,
            currentStep: st,
            formData: { ...f, emergencyContacts: emg, references: rf },
          });
          setSaving("saved");
        } catch {
          setSaving("idle");
        }
      }, 2500);
    },
    [draftId],
  );

  useEffect(() => {
    if (!editId && !dialog) triggerSave(form, emergency, refs, step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, emergency, refs]);

  /* ── draft actions ── */
  const handleContinue = async () => {
    try {
      const r = await axios.get(`/admin/drafts/${draftId}`);
      const fd = r.data.draft.formData || {};
      setForm({ ...INITIAL, ...fd });
      if (fd.emergencyContacts?.length) setEmergency(fd.emergencyContacts);
      if (fd.references?.length) setRefs(fd.references);
      setStep(r.data.draft.currentStep || 0);
    } catch {
      await handleNewStart();
      return;
    }
    setDialog(false);
  };

  const handleNewStart = async () => {
    if (draftId) {
      try {
        await axios.delete(`/admin/drafts/${draftId}`);
      } catch {}
    }
    localStorage.removeItem(DRAFT_KEY);
    setDraftId(null);
    setForm(INITIAL);
    setEmergency([{ ...EMPTY_EMERGENCY }]);
    setRefs([{ ...EMPTY_REFERENCE }]);
    setStep(0);
    setPending([]);
    setDialog(false);
  };

  const handleClear = async () => {
    if (!window.confirm("Clear all form data and start fresh?")) return;
    await handleNewStart();
  };

  /* ── field helpers ── */
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAddr = (which, v) => setForm((f) => ({ ...f, [which]: v }));

  const handleSameAsCurrent = (checked) => {
    setForm((f) => ({
      ...f,
      sameAsCurrent: checked,
      ...(checked ? { permanentAddress: { ...f.currentAddress } } : {}),
    }));
  };

  /* ── emergency ── */
  const setEmg = (i, k, v) =>
    setEmergency((p) => p.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  const addEmg = () => setEmergency((p) => [...p, { ...EMPTY_EMERGENCY }]);
  const removeEmg = (i) => setEmergency((p) => p.filter((_, idx) => idx !== i));

  /* ── references ── */
  const setRef = (i, k, v) =>
    setRefs((p) => p.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const addRef = () => setRefs((p) => [...p, { ...EMPTY_REFERENCE }]);
  const removeRef = (i) => setRefs((p) => p.filter((_, idx) => idx !== i));

  /* ── auto-generate emp code ── */
  const fetchCode = async () => {
    try {
      const r = await axios.get("/admin/next-emp-code");
      set("emp_code", r.data.code);
    } catch {}
  };

  /* ── validation per step ── */
  const validate = (forStep = step) => {
    const e = {};
    const stepKey = STEPS[forStep].key;
    if (pending.includes(stepKey)) {
      setErrors({});
      return true;
    }
    
    if (forStep === 0) {
      if (!form.fullName) e.fullName = "Required";
      if (!form.dob) e.dob = "Required";
      if (!form.gender) e.gender = "Required";
      if (!form.maritalStatus) e.maritalStatus = "Required";
    }
    if (forStep === 1) {
      if (!form.personalMobile) e.personalMobile = "Required";
      if (!form.personalEmail) e.personalEmail = "Required";
      if (!form.currentAddress?.street) e.currentStreet = "Required";
      if (!form.currentAddress?.state) e.currentState = "Required";
      if (!form.currentAddress?.city) e.currentCity = "Required";
      if (!form.sameAsCurrent) {
        if (!form.permanentAddress?.street) e.permanentStreet = "Required";
        if (!form.permanentAddress?.state) e.permanentState = "Required";
        if (!form.permanentAddress?.city) e.permanentCity = "Required";
      }
      if (!emergency[0]?.name) e.emg0name = "Required";
      if (!emergency[0]?.phone) e.emg0phone = "Required";
      if (!emergency[0]?.relationship) e.emg0rel = "Required";
    }
    if (forStep === 2) {
      if (!form.aadharNumber) e.aadharNumber = "Required";
      if (!form.panNumber) e.panNumber = "Required";
    }
    if (forStep === 3) {
      if (!form.highestQualification) e.highestQualification = "Required";
      if (!form.graduationYear) e.graduationYear = "Required";
      if (!form.instituteName) e.instituteName = "Required";
      if (!refs[0]?.name) e.ref0name = "Required";
      if (!refs[0]?.phone) e.ref0phone = "Required";
    }
    if (forStep === 4) {
      if (!form.dateJoining) e.dateJoining = "Required";
      if (!form.employmentType) e.employmentType = "Required";
      if (!form.workLocation) e.workLocation = "Required";
      if (!form.designation) e.designation = "Required";
      if (!form.department) e.department = "Required";
      if (!form.officialEmail) e.officialEmail = "Required";
    }
    if (forStep === 5) {
      if (!form.gross) e.gross = "Required";
      if (!form.ctc) e.ctc = "Required";
      if (!form.accountHolderName) e.accountHolderName = "Required";
      if (!form.bankNameBranch) e.bankNameBranch = "Required";
      if (!form.accountNumber) e.accountNumber = "Required";
      if (!form.ifscCode) e.ifscCode = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── next / back ── */
  const handleNext = () => {
    if (!validate()) return;
    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };
  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
    window.scrollTo(0, 0);
  };

  /* ── skip step ── */
  const handleSkip = () => {
    const sectionName = STEPS[step].key;
    const nextPending = pending.includes(sectionName) ? pending : [...pending, sectionName];
    setPending(nextPending);
    setErrors({});
    if (step < 5) setStep((s) => s + 1);
    else submitForm(true, nextPending);
  };

  const submitForm = async (skipValidation = false, pendingOverrides = pending) => {
    if (!skipValidation && !validate()) return;
    setSubmitting(true);
    setApiError("");
    try {
      const OPTIONAL = [
        "religion",
        "physicallyHandicapped",
        "passportNumber",
        "drivingLicence",
        "voterIdNumber",
        "previousEmployer",
        "reportingManager",
        "workMobile",
        "laptopAssigned",
        "pfNumber",
        "uanNumber",
        "esicNumber",
        "ptNumber",
        "tdsRegime",
        "form12bb",
      ];
      const payload = {
        ...form,
        emergencyContacts: emergency,
        references: refs,
        pendingSections: pendingOverrides,
      };
      OPTIONAL.forEach((k) => {
        if (!payload[k] || payload[k] === "") payload[k] = "not set yet";
      });

      if (!payload.confirmationDate || payload.confirmationDate === "not set yet") {
        delete payload.confirmationDate;
      }

      if (editId) await axios.put(`/admin/employees/${editId}`, payload);
      else await axios.post("/admin/employees", payload);

      if (draftId) {
        try {
          await axios.delete(`/admin/drafts/${draftId}`);
        } catch {}
        localStorage.removeItem(DRAFT_KEY);
      }
      navigate("/hr/all-employees");
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to save employee");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── skip banner ── */
  const SkipBanner = ({ sectionKey, sectionLabel }) => {
    const isSkipped = pending.includes(sectionKey);
    return isSkipped ? (
      <div
        style={{
          padding: "10px 14px",
          background: "#fff3cd",
          borderRadius: 6,
          marginBottom: 14,
          fontSize: 11,
          color: "#856404",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          ⚠️ {sectionLabel} marked as "Add Later" — not required to save.
        </span>
        <button
          style={{
            border: "none",
            background: "none",
            color: "#0f172a",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 11,
            textDecoration: "underline",
          }}
          onClick={() => setPending((p) => p.filter((s) => s !== sectionKey))}
        >
          Fill now
        </button>
      </div>
    ) : null;
  };

  /* ── INline JSX renderer — avoids nested component remount bug ── */
  const renderStep = () => {
    switch (step) {
      /* ══ STEP 0: Basic Identity ══════════════════════════════════ */
      case 0:
        return (
          <div className="ae-section">
            <div className="ae-section-title">
              <span>🆔</span> Basic Identity
            </div>
            <div className="ae-grid-2">
              <Field label="Full Name" required error={errors.fullName}>
                <input
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  className={errors.fullName ? "error" : ""}
                  placeholder="As per official documents"
                />
              </Field>
              <Field label="Date of Birth" required error={errors.dob}>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                  className={errors.dob ? "error" : ""}
                />
              </Field>
              <Field label="Gender" required error={errors.gender}>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className={errors.gender ? "error" : ""}
                >
                  <option value="">Select gender</option>
                  {(refData?.genders || ["Male", "Female", "Other"]).map(
                    (g) => (
                      <option key={g}>{g}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field
                label="Marital Status"
                required
                error={errors.maritalStatus}
              >
                <select
                  value={form.maritalStatus}
                  onChange={(e) => set("maritalStatus", e.target.value)}
                  className={errors.maritalStatus ? "error" : ""}
                >
                  <option value="">Select status</option>
                  {(
                    refData?.maritalStatuses || [
                      "Single",
                      "Married",
                      "Divorced",
                      "Engaged",
                    ]
                  ).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Religion">
                <input
                  value={form.religion === "not set yet" ? "" : form.religion}
                  onChange={(e) => set("religion", e.target.value)}
                  placeholder="e.g. Hindu, Muslim…"
                />
              </Field>
              <Field label="Physically Handicapped">
                <select
                  value={
                    form.physicallyHandicapped === "not set yet"
                      ? ""
                      : form.physicallyHandicapped
                  }
                  onChange={(e) => set("physicallyHandicapped", e.target.value)}
                >
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </Field>
            </div>
          </div>
        );

      /* ══ STEP 1: Contact ═════════════════════════════════════════ */
      case 1:
        return (
          <>
            <div className="ae-section">
              <div className="ae-section-title">
                <span>📞</span> Contact Details
              </div>
              <div className="ae-grid-2" style={{ marginBottom: 14 }}>
                <Field
                  label="Personal Mobile"
                  required
                  error={errors.personalMobile}
                >
                  <input
                    value={form.personalMobile}
                    onChange={(e) => set("personalMobile", e.target.value)}
                    className={errors.personalMobile ? "error" : ""}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </Field>
                <Field
                  label="Personal Email"
                  required
                  error={errors.personalEmail}
                >
                  <input
                    type="email"
                    value={form.personalEmail}
                    onChange={(e) => set("personalEmail", e.target.value)}
                    className={errors.personalEmail ? "error" : ""}
                    placeholder="email@example.com"
                  />
                </Field>
              </div>

              <div
                style={{
                  fontWeight: 600,
                  fontSize: 11,
                  color: "var(--color-text-secondary)",
                  marginBottom: 8,
                }}
              >
                Current Residential Address{" "}
                <span style={{ color: "#dc2626" }}>*</span>
              </div>
              <AddressBlock
                prefix="current"
                values={form.currentAddress}
                onChange={(v) => {
                  setAddr("currentAddress", v);
                  if (form.sameAsCurrent) setAddr("permanentAddress", v);
                }}
                errors={errors}
              />

              <label className="ae-check-row" style={{ marginTop: 12 }}>
                <input
                  type="checkbox"
                  checked={form.sameAsCurrent}
                  onChange={(e) => handleSameAsCurrent(e.target.checked)}
                />
                Permanent address same as current address
              </label>

              {!form.sameAsCurrent && (
                <>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 11,
                      color: "var(--color-text-secondary)",
                      marginBottom: 8,
                      marginTop: 8,
                    }}
                  >
                    Permanent Address{" "}
                    <span style={{ color: "#dc2626" }}>*</span>
                  </div>
                  <AddressBlock
                    prefix="permanent"
                    values={form.permanentAddress}
                    onChange={(v) => setAddr("permanentAddress", v)}
                    errors={errors}
                  />
                </>
              )}
            </div>

            {/* Emergency Contacts */}
            <div className="ae-section">
              <div className="ae-section-title">
                <span>🚨</span> Emergency Contacts
              </div>
              {emergency.map((em, i) => (
                <div key={i} className="ae-dyn-item">
                  <div className="ae-dyn-item-header">
                    <span className="ae-dyn-item-label">
                      Contact {i + 1}
                      {i === 0 ? " (required)" : ""}
                    </span>
                    {i > 0 && (
                      <button
                        className="ae-remove-btn"
                        onClick={() => removeEmg(i)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="ae-grid-3">
                    <div className="ae-field">
                      <label className="ae-label">
                        Name {i === 0 && <span className="req">*</span>}
                      </label>
                      <input
                        value={em.name}
                        onChange={(ev) => setEmg(i, "name", ev.target.value)}
                        className={errors[`emg${i}name`] ? "error" : ""}
                        placeholder="Full name"
                      />
                      {errors[`emg${i}name`] && (
                        <span className="ae-field-error">
                          {errors[`emg${i}name`]}
                        </span>
                      )}
                    </div>
                    <div className="ae-field">
                      <label className="ae-label">
                        Phone {i === 0 && <span className="req">*</span>}
                      </label>
                      <input
                        value={em.phone}
                        onChange={(ev) => setEmg(i, "phone", ev.target.value)}
                        className={errors[`emg${i}phone`] ? "error" : ""}
                        placeholder="Mobile number"
                      />
                      {errors[`emg${i}phone`] && (
                        <span className="ae-field-error">
                          {errors[`emg${i}phone`]}
                        </span>
                      )}
                    </div>
                    <div className="ae-field">
                      <label className="ae-label">
                        Relationship {i === 0 && <span className="req">*</span>}
                      </label>
                      <select
                        value={em.relationship}
                        onChange={(ev) =>
                          setEmg(i, "relationship", ev.target.value)
                        }
                        className={errors[`emg${i}rel`] ? "error" : ""}
                      >
                        <option value="">Select relationship</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors[`emg${i}rel`] && (
                        <span className="ae-field-error">
                          {errors[`emg${i}rel`]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button className="ae-add-btn" onClick={addEmg}>
                <i className="ti ti-plus" /> Add another emergency contact
              </button>
            </div>
          </>
        );

      /* ══ STEP 2: Government ID ═══════════════════════════════════ */
      case 2:
        return (
          <div className="ae-section">
            <div className="ae-section-title">
              <span>🪪</span> Government Identification
            </div>
            <div className="ae-grid-2">
              <Field
                label="Aadhaar Number"
                required
                error={errors.aadharNumber}
              >
                <input
                  value={form.aadharNumber}
                  onChange={(e) => set("aadharNumber", e.target.value)}
                  className={errors.aadharNumber ? "error" : ""}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                />
              </Field>
              <Field label="PAN Number" required error={errors.panNumber}>
                <input
                  value={form.panNumber}
                  onChange={(e) =>
                    set("panNumber", e.target.value.toUpperCase())
                  }
                  className={errors.panNumber ? "error" : ""}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </Field>
              <Field label="Passport Number">
                <input
                  value={
                    form.passportNumber === "not set yet"
                      ? ""
                      : form.passportNumber
                  }
                  onChange={(e) => set("passportNumber", e.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Driving Licence Number">
                <input
                  value={
                    form.drivingLicence === "not set yet"
                      ? ""
                      : form.drivingLicence
                  }
                  onChange={(e) => set("drivingLicence", e.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Voter ID Number">
                <input
                  value={
                    form.voterIdNumber === "not set yet"
                      ? ""
                      : form.voterIdNumber
                  }
                  onChange={(e) => set("voterIdNumber", e.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </div>
          </div>
        );

      /* ══ STEP 3: Education ═══════════════════════════════════════ */
      case 3:
        return (
          <>
            <div className="ae-section">
              <div className="ae-section-title">
                <span>🎓</span> Educational Background
              </div>
              <div className="ae-grid-2">
                <Field
                  label="Highest Qualification"
                  required
                  error={errors.highestQualification}
                >
                  <input
                    value={form.highestQualification}
                    onChange={(e) =>
                      set("highestQualification", e.target.value)
                    }
                    className={errors.highestQualification ? "error" : ""}
                    placeholder="e.g. B.Tech, MBA"
                  />
                </Field>
                <Field
                  label="Graduation Year"
                  required
                  error={errors.graduationYear}
                >
                  <select
                    value={form.graduationYear}
                    onChange={(e) => set("graduationYear", e.target.value)}
                    className={errors.graduationYear ? "error" : ""}
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Institute / University"
                  required
                  error={errors.instituteName}
                >
                  <input
                    value={form.instituteName}
                    onChange={(e) => set("instituteName", e.target.value)}
                    className={errors.instituteName ? "error" : ""}
                    placeholder="University or college name"
                  />
                </Field>
                <Field label="Previous Employer">
                  <input
                    value={
                      form.previousEmployer === "not set yet"
                        ? ""
                        : form.previousEmployer
                    }
                    onChange={(e) => set("previousEmployer", e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </div>
            </div>

            <div className="ae-section">
              <div className="ae-section-title">
                <span>📋</span> Reference Contacts
              </div>
              {refs.map((r, i) => (
                <div key={i} className="ae-dyn-item">
                  <div className="ae-dyn-item-header">
                    <span className="ae-dyn-item-label">
                      Reference {i + 1}
                      {i === 0 ? " (required)" : ""}
                    </span>
                    {i > 0 && (
                      <button
                        className="ae-remove-btn"
                        onClick={() => removeRef(i)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="ae-grid-3">
                    <div className="ae-field">
                      <label className="ae-label">
                        Name {i === 0 && <span className="req">*</span>}
                      </label>
                      <input
                        value={r.name}
                        onChange={(e) => setRef(i, "name", e.target.value)}
                        className={errors[`ref${i}name`] ? "error" : ""}
                      />
                      {errors[`ref${i}name`] && (
                        <span className="ae-field-error">
                          {errors[`ref${i}name`]}
                        </span>
                      )}
                    </div>
                    <div className="ae-field">
                      <label className="ae-label">
                        Phone {i === 0 && <span className="req">*</span>}
                      </label>
                      <input
                        value={r.phone}
                        onChange={(e) => setRef(i, "phone", e.target.value)}
                        className={errors[`ref${i}phone`] ? "error" : ""}
                      />
                      {errors[`ref${i}phone`] && (
                        <span className="ae-field-error">
                          {errors[`ref${i}phone`]}
                        </span>
                      )}
                    </div>
                    <div className="ae-field">
                      <label className="ae-label">
                        Email <span className="opt">optional</span>
                      </label>
                      <input
                        type="email"
                        value={r.email}
                        onChange={(e) => setRef(i, "email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button className="ae-add-btn" onClick={addRef}>
                <i className="ti ti-plus" /> Add another reference
              </button>
            </div>
          </>
        );

      /* ══ STEP 4: Employment ══════════════════════════════════════ */
      case 4: {
        const isPending = pending.includes("employment");
        return (
          <>
            <SkipBanner
              sectionKey="employment"
              sectionLabel="Employment details"
            />
            <div
              style={{
                opacity: isPending ? 0.45 : 1,
                pointerEvents: isPending ? "none" : "auto",
              }}
            >
              <div className="ae-section">
                <div className="ae-section-title">
                  <span>🧾</span> Employment Record
                </div>
                <div className="ae-field" style={{ marginBottom: 12 }}>
                  <label className="ae-label">
                    Employee ID <span className="req">*</span>
                  </label>
                  <div className="ae-empcode-row">
                    <input
                      value={form.emp_code}
                      onChange={(e) => set("emp_code", e.target.value)}
                      placeholder="e.g. EMP0042 or auto-generate"
                    />
                    <button
                      className="ae-empcode-btn"
                      onClick={fetchCode}
                      type="button"
                    >
                      Auto-generate
                    </button>
                  </div>
                </div>
                <div className="ae-grid-2">
                  <Field
                    label="Date of Joining"
                    required
                    error={errors.dateJoining}
                  >
                    <input
                      type="date"
                      value={form.dateJoining}
                      onChange={(e) => set("dateJoining", e.target.value)}
                      className={errors.dateJoining ? "error" : ""}
                    />
                  </Field>
                  <Field
                    label="Employment Type"
                    required
                    error={errors.employmentType}
                  >
                    <select
                      value={form.employmentType}
                      onChange={(e) => set("employmentType", e.target.value)}
                      className={errors.employmentType ? "error" : ""}
                    >
                      <option value="">Select type</option>
                      {(
                        refData?.employmentTypes || [
                          "Full-Time",
                          "Contract",
                          "Intern",
                          "Notice-Period",
                        ]
                      ).map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Probation (months)">
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={form.probationMonths}
                      onChange={(e) =>
                        set("probationMonths", Number(e.target.value))
                      }
                    />
                  </Field>
                  <Field label="Confirmation Date">
                    <input
                      type="date"
                      value={
                        form.confirmationDate === "not set yet" || !form.confirmationDate
                          ? ""
                          : form.confirmationDate
                      }
                      onChange={(e) => set("confirmationDate", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Work Location"
                    required
                    error={errors.workLocation}
                  >
                    <select
                      value={form.workLocation}
                      onChange={(e) => set("workLocation", e.target.value)}
                      className={errors.workLocation ? "error" : ""}
                    >
                      <option value="">Select location</option>
                      {(
                        refData?.workLocations || ["Office", "Remote", "Hybrid"]
                      ).map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              <div className="ae-section">
                <div className="ae-section-title">
                  <span>👔</span> Designation & Reporting
                </div>
                <div className="ae-grid-2">
                  <Field
                    label="Designation"
                    required
                    error={errors.designation}
                  >
                    <select
                      value={form.designation}
                      onChange={(e) => set("designation", e.target.value)}
                      className={errors.designation ? "error" : ""}
                    >
                      <option value="">Select designation</option>
                      {(refData?.designations || []).map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Department" required error={errors.department}>
                    <select
                      value={form.department}
                      onChange={(e) => set("department", e.target.value)}
                      className={errors.department ? "error" : ""}
                    >
                      <option value="">Select department</option>
                      {(refData?.departments || []).map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Reporting Manager">
                    <input
                      value={
                        form.reportingManager === "not set yet"
                          ? ""
                          : form.reportingManager
                      }
                      onChange={(e) => set("reportingManager", e.target.value)}
                      placeholder="Optional"
                    />
                  </Field>
                </div>
              </div>

              <div className="ae-section">
                <div className="ae-section-title">
                  <span>💼</span> Official Work Contact
                </div>
                <div className="ae-grid-2">
                  <Field
                    label="Official Email"
                    required
                    error={errors.officialEmail}
                  >
                    <input
                      type="email"
                      value={form.officialEmail}
                      onChange={(e) => set("officialEmail", e.target.value)}
                      className={errors.officialEmail ? "error" : ""}
                      placeholder="name@company.com"
                    />
                  </Field>
                  <Field label="Work Mobile">
                    <input
                      value={
                        form.workMobile === "not set yet" ? "" : form.workMobile
                      }
                      onChange={(e) => set("workMobile", e.target.value)}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Laptop / Asset Assigned">
                    <input
                      value={
                        form.laptopAssigned === "not set yet"
                          ? ""
                          : form.laptopAssigned
                      }
                      onChange={(e) => set("laptopAssigned", e.target.value)}
                      placeholder="e.g. Dell #D001"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </>
        );
      }

      /* ══ STEP 5: Payroll ═════════════════════════════════════════ */
      case 5: {
        const isPending = pending.includes("payroll");
        return (
          <>
            <SkipBanner sectionKey="payroll" sectionLabel="Payroll details" />
            <div
              style={{
                opacity: isPending ? 0.45 : 1,
                pointerEvents: isPending ? "none" : "auto",
              }}
            >
              <div className="ae-section">
                <div className="ae-section-title">
                  <span>💵</span> CTC Structure
                </div>
                <div className="ae-grid-2">
                  <Field
                    label="Gross Salary (monthly)"
                    required
                    error={errors.gross}
                  >
                    <input
                      type="number"
                      value={form.gross}
                      onChange={(e) => set("gross", e.target.value)}
                      className={errors.gross ? "error" : ""}
                      placeholder="e.g. 50000"
                    />
                  </Field>
                  <Field label="CTC (annual)" required error={errors.ctc}>
                    <input
                      type="number"
                      value={form.ctc}
                      onChange={(e) => set("ctc", e.target.value)}
                      className={errors.ctc ? "error" : ""}
                      placeholder="e.g. 600000"
                    />
                  </Field>
                </div>
              </div>

              <div className="ae-section">
                <div className="ae-section-title">
                  <span>🏦</span> Bank Details
                </div>
                <div className="ae-grid-2">
                  <Field
                    label="Account Holder Name"
                    required
                    error={errors.accountHolderName}
                  >
                    <input
                      value={form.accountHolderName}
                      onChange={(e) => set("accountHolderName", e.target.value)}
                      className={errors.accountHolderName ? "error" : ""}
                    />
                  </Field>
                  <Field
                    label="Bank Name & Branch"
                    required
                    error={errors.bankNameBranch}
                  >
                    <input
                      value={form.bankNameBranch}
                      onChange={(e) => set("bankNameBranch", e.target.value)}
                      className={errors.bankNameBranch ? "error" : ""}
                      placeholder="HDFC Bank, Ahmedabad"
                    />
                  </Field>
                  <Field
                    label="Account Number"
                    required
                    error={errors.accountNumber}
                  >
                    <input
                      value={form.accountNumber}
                      onChange={(e) => set("accountNumber", e.target.value)}
                      className={errors.accountNumber ? "error" : ""}
                    />
                  </Field>
                  <Field label="IFSC Code" required error={errors.ifscCode}>
                    <input
                      value={form.ifscCode}
                      onChange={(e) =>
                        set("ifscCode", e.target.value.toUpperCase())
                      }
                      className={errors.ifscCode ? "error" : ""}
                      placeholder="HDFC0001234"
                      maxLength={11}
                    />
                  </Field>
                </div>
              </div>

              <div className="ae-section">
                <div className="ae-section-title">
                  <span>🧾</span> Statutory & Compliance
                </div>
                <div className="ae-grid-2">
                  <div className="ae-bool-row">
                    <Field label="PF Applicable">
                      <select
                        value={form.pfApplicable ? "yes" : "no"}
                        onChange={(e) =>
                          set("pfApplicable", e.target.value === "yes")
                        }
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </Field>
                    {form.pfApplicable && (
                      <Field label="PF Number">
                        <input
                          value={
                            form.pfNumber === "not set yet" ? "" : form.pfNumber
                          }
                          onChange={(e) => set("pfNumber", e.target.value)}
                        />
                      </Field>
                    )}
                  </div>

                  <Field label="UAN Number">
                    <input
                      value={
                        form.uanNumber === "not set yet" ? "" : form.uanNumber
                      }
                      onChange={(e) => set("uanNumber", e.target.value)}
                      placeholder="Optional"
                    />
                  </Field>

                  <div className="ae-bool-row">
                    <Field label="ESIC Applicable">
                      <select
                        value={form.esicApplicable ? "yes" : "no"}
                        onChange={(e) =>
                          set("esicApplicable", e.target.value === "yes")
                        }
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </Field>
                    {form.esicApplicable && (
                      <Field label="ESIC Number">
                        <input
                          value={
                            form.esicNumber === "not set yet"
                              ? ""
                              : form.esicNumber
                          }
                          onChange={(e) => set("esicNumber", e.target.value)}
                        />
                      </Field>
                    )}
                  </div>

                  <div className="ae-bool-row">
                    <Field label="PT Applicable">
                      <select
                        value={form.ptApplicable ? "yes" : "no"}
                        onChange={(e) =>
                          set("ptApplicable", e.target.value === "yes")
                        }
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </Field>
                    {form.ptApplicable && (
                      <Field label="PT Number">
                        <input
                          value={
                            form.ptNumber === "not set yet" ? "" : form.ptNumber
                          }
                          onChange={(e) => set("ptNumber", e.target.value)}
                        />
                      </Field>
                    )}
                  </div>

                  <Field label="TDS Regime">
                    <select
                      value={
                        form.tdsRegime === "not set yet" ? "" : form.tdsRegime
                      }
                      onChange={(e) => set("tdsRegime", e.target.value)}
                    >
                      <option value="">Select regime</option>
                      <option>Old Tax Regime</option>
                      <option>New Tax Regime</option>
                    </select>
                  </Field>

                  <Field label="Form 12BB Declarations">
                    <input
                      value={
                        form.form12bb === "not set yet" ? "" : form.form12bb
                      }
                      onChange={(e) => set("form12bb", e.target.value)}
                      placeholder="Optional"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </>
        );
      }

      default:
        return null;
    }
  };

  /* ── stepper ── */
  const renderStepper = () => (
    <div className="ae-stepper">
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <div className="ae-step">
            <div
              className={`ae-step-bubble ${i < step ? "done" : i === step ? "active" : ""}`}
            >
              {i < step ? (
                <i className="ti ti-check" style={{ fontSize: 11 }} />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`ae-step-label ${i === step ? "active" : i < step ? "done" : ""}`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`ae-step-line ${i < step ? "done" : ""}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  /* ── render ── */
  return (
    <div className="ae-wrap">
      {/* Continue dialog */}
      {dialog && (
        <div className="ae-dialog-overlay">
          <div className="ae-dialog">
            <h3>📝 Continue editing?</h3>
            <p>
              You have an unsaved draft. Continue from where you left off, or
              start a fresh form?
            </p>
            <div className="ae-dialog-actions">
              <button className="btn btn-secondary" onClick={handleNewStart}>
                New start
              </button>
              <button className="btn btn-primary" onClick={handleContinue}>
                Continue editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="ae-header">
        <div className="ae-header-left">
          <h2>{editId ? "Edit Employee" : "Add New Employee"}</h2>
          <p>
            Step {step + 1} of {STEPS.length} — {STEPS[step].icon}{" "}
            {STEPS[step].label}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`ae-autosave ${saving === "saved" ? "saved" : ""}`}>
            {saving === "saved" && (
              <>
                <i className="ti ti-check" /> Saved
              </>
            )}
            {saving === "saving" && (
              <>
                <i className="ti ti-loader-2" /> Saving…
              </>
            )}
            {saving === "idle" && (
              <>
                <i className="ti ti-cloud" /> Auto-save on
              </>
            )}
          </span>
          {!editId && (
            <button
              className="btn btn-secondary"
              onClick={handleClear}
              style={{ fontSize: 11, padding: "4px 10px" }}
            >
              <i className="ti ti-trash" /> Clear form
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      {renderStepper()}

      {/* Error Banner */}
      {apiError && (
        <div style={{ padding: "12px 16px", background: "#fee2e2", color: "#b91c1c", borderRadius: 6, marginBottom: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 18 }} />
          <div>
            <strong>Error saving employee:</strong> {apiError}
          </div>
        </div>
      )}

      {/* Step content */}
      {renderStep()}

      {/* Navigation */}
      <div className="ae-nav">
        <div className="ae-nav-left">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/hr/all-employees")}
          >
            <i className="ti ti-x" /> Cancel
          </button>
          {step > 0 && (
            <button className="btn btn-secondary" onClick={handleBack}>
              <i className="ti ti-arrow-left" /> Back
            </button>
          )}
        </div>

        <div className="ae-nav-right">
          {STEPS[step].skippable && (
            <button
              className="ae-later-btn"
              onClick={handleSkip}
            >
              <i className="ti ti-clock" /> Skip for now — Add later
            </button>
          )}

          {step < STEPS.length - 1 && (
            <button className="btn btn-primary" onClick={handleNext}>
              Next <i className="ti ti-arrow-right" />
            </button>
          )}

          {step === STEPS.length - 1 && (
            <button
              className="btn btn-primary"
              onClick={() => submitForm(false)}
              disabled={submitting}
            >
              {submitting ? (
                "Saving…"
              ) : editId ? (
                <>
                  <i className="ti ti-device-floppy" /> Save Changes
                </>
              ) : (
                <>
                  <i className="ti ti-user-plus" /> Add Employee
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
