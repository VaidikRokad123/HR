export const ROLES = {
  EMPLOYEE: 'employee',
  HR: 'hr'
};

export const DEPARTMENTS = [
  'Product & Delivery',
  'Human Resources',
  'Sales & marketing',
  'Design',
  'Engineering'
];

export const DESIGNATIONS = [
  'SR Quality Assurance Engineer',
  'Team Lead - Software Development',
  'Software Development Engineer - SDE 3',
  'Software Development Engineer - SDE 2',
  'Software Development Engineer - SDE 1',
  'Software Development - Intern',
  'Jr. Video Editor',
  'Sr. Human Resource Executive',
  'Product Manager',
  'Team Lead',
  'Jr Human Resource Executive',
  'Sr. BDE',
  'Sr. UI/UX',
  'Intern-Graphics',
  'Intern - UI/UX UI/UX Designer',
  'Quality Assurance Engineer',
  'Quality Assurance - Intern',
  'JR Quality Assurance Engineer'
];

export const EMPLOYMENT_TYPES = [
  'Temporary',
  'Permanent',
  'Contract Base',
  'Probation',
  'Internship',
  'Trainee',
  'Notice period'
];

export const PERMISSIONS = {
  EMPLOYEE_READ_SELF: 'employee:read:self',
  EMPLOYEE_UPDATE_SELF: 'employee:update:self',
  EMPLOYEE_COMPLETE_PROFILE: 'employee:complete-profile',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_UPDATE_SELF: 'notification:update:self',
  HR_READ: 'hr:read',
  HR_WRITE: 'hr:write',
  HR_TRIGGER_REMINDERS: 'hr:trigger-reminders'
};

const HR_DEPARTMENT = 'Human Resources';
const SENIOR_HR_DESIGNATION = 'Sr. Human Resource Executive';
const JUNIOR_HR_DESIGNATION = 'Jr Human Resource Executive';

const BASE_ROLE_PERMISSIONS = {
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.EMPLOYEE_READ_SELF,
    PERMISSIONS.EMPLOYEE_UPDATE_SELF,
    PERMISSIONS.EMPLOYEE_COMPLETE_PROFILE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_UPDATE_SELF
  ],
  [ROLES.HR]: [
    PERMISSIONS.EMPLOYEE_READ_SELF,
    PERMISSIONS.EMPLOYEE_UPDATE_SELF,
    PERMISSIONS.EMPLOYEE_COMPLETE_PROFILE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_UPDATE_SELF,
    PERMISSIONS.HR_READ,
    PERMISSIONS.HR_WRITE,
    PERMISSIONS.HR_TRIGGER_REMINDERS
  ]
};

const HR_DESIGNATION_PERMISSIONS = {
  [SENIOR_HR_DESIGNATION]: [
    PERMISSIONS.HR_READ,
    PERMISSIONS.HR_WRITE,
    PERMISSIONS.HR_TRIGGER_REMINDERS
  ],
  [JUNIOR_HR_DESIGNATION]: [
    PERMISSIONS.HR_READ
  ]
};

const unique = (items) => [...new Set(items.filter(Boolean))];

export const getEffectiveAccess = ({ user, professional } = {}) => {
  const storedRole = user?.role || ROLES.EMPLOYEE;
  const department = professional?.department;
  const designation = professional?.jobTitle;
  const isHrDepartment = department === HR_DEPARTMENT;
  const hrDesignationPermissions = isHrDepartment
    ? HR_DESIGNATION_PERMISSIONS[designation] || []
    : [];
  const hasHrDesignation = hrDesignationPermissions.length > 0;

  const effectiveRole = storedRole === ROLES.HR || hasHrDesignation
    ? ROLES.HR
    : storedRole;

  const basePermissions = storedRole === ROLES.HR && !hasHrDesignation
    ? BASE_ROLE_PERMISSIONS[ROLES.HR]
    : BASE_ROLE_PERMISSIONS[ROLES.EMPLOYEE];
  const permissions = unique([
    ...basePermissions,
    ...hrDesignationPermissions
  ]);

  const permissionSet = new Set(permissions);

  return {
    role: effectiveRole,
    storedRole,
    department,
    jobTitle: designation,
    permissions,
    isViewOnly: effectiveRole === ROLES.HR && !permissionSet.has(PERMISSIONS.HR_WRITE),
    canReadHr: permissionSet.has(PERMISSIONS.HR_READ),
    canWriteHr: permissionSet.has(PERMISSIONS.HR_WRITE)
  };
};

export const hasPermission = (access, permission) => {
  return Boolean(access?.permissions?.includes(permission));
};

export const buildUserResponse = ({ user, professional }) => {
  const access = getEffectiveAccess({ user, professional });

  return {
    id: user._id,
    email: user.email,
    role: access.role,
    storedRole: access.storedRole,
    emp_code: user.emp_code,
    status: user.status,
    department: access.department,
    jobTitle: access.jobTitle,
    permissions: access.permissions,
    isViewOnly: access.isViewOnly,
    canReadHr: access.canReadHr,
    canWriteHr: access.canWriteHr
  };
};
