# Payroll System Implementation Guide

**Comprehensive Reference for Building a Robust Payroll System**

---

## 1. Employee Master Data

| Field | Description |
|-------|-------------|
| Employee ID | Unique identifier (auto or manual) |
| Full Name | As per PAN/Aadhaar |
| Father's/Spouse Name | Family details |
| Date of Birth | For age verification and statutory compliance |
| Gender | Male / Female / Other |
| Date of Joining (DOJ) | Service start date |
| Date of Confirmation | Probation completion date |
| Date of Resignation/Termination | Exit date (if applicable) |
| Last Working Day (LWD) | Final working day |
| Department | Department assignment |
| Designation | Job title |
| Grade/Level/Band | Salary grade classification |
| Location/Branch/Plant | Work location |
| Reporting Manager | Supervisor/manager |
| Employment Type | Permanent / Contractual / Probation / Trainee / Part-time / Full-time / Consultant |
| Shift Details | Shift assignment (if applicable) |
| Weekly Off Pattern | Days off per week |
| Notice Period | Notice period in days |
| Cost Center / Project Code | Cost allocation code |
| Pay Group / Pay Frequency | Monthly / Weekly / Bi-weekly / Daily |

---

## 2. Statutory & Compliance Details

| Field | Description |
|-------|-------------|
| PAN Number | Permanent Account Number (tax) |
| Aadhaar Number | Unique identity number |
| UAN | Universal Account Number (PF) |
| PF Number | Provident Fund account number |
| ESI Number | ESI registration number (if applicable) |
| Professional Tax State | State for PT deduction |
| Tax Regime Selection | Old vs New tax regime |
| IT Declaration | Section 80C, 80D, HRA, etc. |
| Form 16 Details | Annual tax statement data |
| LWF State | Labour Welfare Fund state |
| Gratuity Eligibility | Auto after 5+ years |
| NPS Account | National Pension System (if applicable) |

---

## 3. Bank & Payment Details

| Field | Description |
|-------|-------------|
| Bank Name | Name of the bank |
| Branch Name | Bank branch |
| Account Number | Bank account number |
| IFSC Code | Indian Financial System Code |
| Account Type | Savings / Current |
| Payment Mode | Bank Transfer / Cheque / Cash |
| Multiple Bank Accounts | For split salary configuration |
| Account Holder Name | As per bank records |

---

## 4. Salary Structure (CTC Breakdown)

### 4.1 Earnings (Fixed Components)

| Component | Description |
|-----------|-------------|
| Basic Salary | 40-50% of CTC recommended |
| Dearness Allowance (DA) | Applicable for government/PSU |
| House Rent Allowance (HRA) | 40-50% of Basic (50% metro, 40% non-metro) |
| Conveyance Allowance | Transport allowance |
| Medical Allowance | Medical expense allowance |
| Special Allowance | Balancing figure in CTC |
| Education Allowance | Children's education |
| Telephone/Mobile Allowance | Communication allowance |
| Uniform Allowance | Work uniform |
| City Compensatory Allowance (CCA) | City cost adjustment |
| Washing Allowance | Laundry allowance |
| Food/Meal Allowance | Meal coupons/allowance |
| Leave Travel Allowance (LTA/LTC) | Travel benefit |
| Car Allowance / Fuel Allowance | Vehicle allowance |
| Driver Allowance | Driver expense |
| Servant Allowance | Domestic help allowance |
| Hardship Allowance | Difficult work condition allowance |
| Foreign Allowance | For expatriate employees |

### 4.2 Earnings (Variable Components)

| Component | Description |
|-----------|-------------|
| Performance Bonus / Incentive | Performance-linked pay |
| Sales Commission | Sales-based earnings |
| Target Achievement Bonus | Goal-based bonus |
| Quarterly / Annual Bonus | Periodic bonus payments |
| Festival Bonus | Festival-specific (e.g., Diwali) |
| Retention Bonus | Employee retention incentive |
| Joining Bonus | Sign-on incentive |
| Referral Bonus | Employee referral reward |

### 4.3 Reimbursements

| Component | Description |
|-----------|-------------|
| Travel Reimbursement | Business travel expenses |
| Fuel Reimbursement | Fuel expenses |
| Mobile/Internet Reimbursement | Communication expenses |
| Medical Reimbursement | Bill-based medical claims |
| Relocation Reimbursement | Moving expenses |
| Food/Meal Reimbursement | Meal expenses |

### 4.4 Other Earnings

| Component | Description |
|-----------|-------------|
| Overtime (OT) Pay | Extra hours worked |
| Night Shift Allowance | Night shift differential |
| Arrears | Back-dated salary revision |
| Ex-gratia | Discretionary payment |
| Stipend | For trainees/interns |
| Leave Encashment | Unused leave payout |
| Attendance Bonus | Perfect attendance reward |
| Holiday Pay | Work on holidays |
| Acting Allowance | Higher post temporarily |

---

## 5. Deductions

### 5.1 Statutory Deductions

| Deduction | Description |
|-----------|-------------|
| EPF (Employee) | 12% of (Basic + DA), max base 15,000 |
| ESI (Employee) | 0.75% of Gross (if gross <= 21,000) |
| Professional Tax (PT) | State-wise slab, max ~2,500/year |
| TDS | Income Tax as per regime (Old/New) |
| Labour Welfare Fund (LWF) | State-specific, 6 to 75 |

### 5.2 Voluntary / Company Deductions

| Deduction | Description |
|-----------|-------------|
| VPF | Voluntary Provident Fund |
| NPS Employee Contribution | National Pension System |
| Group Insurance Premium | Insurance deduction |
| Mediclaim/Health Insurance | Health insurance premium |
| Loan EMI Recovery | Housing, Vehicle, Personal, Festival |
| Canteen/Food Deduction | Meal charges |
| Transport Deduction | Transport facility charges |
| Uniform Deduction | Uniform cost recovery |
| Loss of Pay (LOP) | Unpaid leave deduction |
| Late Coming / Early Going | Attendance penalty |
| Notice Period Recovery | Shortfall recovery |
| Salary Advance Recovery | Advance repayment |

### 5.3 Employer Contributions

| Contribution | Description |
|--------------|-------------|
| EPF Employer | 12% of (Basic + DA); 8.33% to EPS, 3.67% to EPF |
| PF Admin Charges | 0.50% of (Basic + DA) |
| EDLI | 0.50% of (Basic + DA) |
| ESI Employer | 3.25% of Gross |
| Gratuity Provision | 4.81% of Basic |
| LWF Employer | State-specific |
| NPS Employer | Up to 10% of Basic + DA |
| Group Insurance | Employer-paid |
| Bonus (Statutory) | 8.33% to 20% of Basic + DA |

---

## 6. Attendance & Leave Management

### 6.1 Attendance Inputs

| Input | Description |
|-------|-------------|
| Total Calendar Days | Days in the month |
| Total Working Days | Excluding Sundays and holidays |
| Present Days | Days attended |
| Absent Days (Unauthorized) | Days absent without approval |
| Half Days | Partial day attendance |
| Late Comings | Count and total minutes late |
| Early Goings | Early departure count |
| Overtime Hours | Extra hours worked |
| Weekly Offs Availed | Days off taken |
| Comp Offs Earned & Availed | Compensatory off tracking |
| Work From Home Days | Remote work days |
| Short Leave | Hours of short leave |

### 6.2 Attendance Methods

- Biometric (Fingerprint / Face / Iris)
- RFID Card / Access Card
- GPS-based (for field staff)
- Geo-fencing (WFH / Remote)
- Manual Register with Digital Entry
- Mobile App Check-in
- Web Portal Check-in

### 6.3 Attendance Rules Engine

| Rule | Description |
|------|-------------|
| Grace Period | Configurable late allowance (e.g., 15 min) |
| Late to Absent Rule | X late marks = Y absent (configurable) |
| Minimum Working Hours | Per day requirement |
| Break Time Rules | Lunch/break duration |
| Auto Absent Marking | Automatic absent if no punch |
| Regularization | Request and approval workflow |
| Sandwich Rule | Leave between holidays = all counted |

### 6.4 Leave Types

| Leave Type | Description |
|------------|-------------|
| Casual Leave (CL) | Short-duration personal leave |
| Sick Leave (SL) / Medical Leave | Health-related leave |
| Earned Leave (EL) / Privilege Leave (PL) | Annual earned leave |
| Maternity Leave | 26 weeks statutory |
| Paternity Leave | Father's leave |
| Bereavement Leave | Family loss |
| Marriage Leave | Wedding leave |
| Compensatory Off (Comp Off) | OT compensation |
| Study Leave | Education leave |
| Sabbatical | Extended break |
| Leave Without Pay (LWP/LOP) | Unpaid leave |
| Half Day Leave | Partial day leave |
| Special Leave | Other approved leave |

### 6.5 Leave Policy Rules

| Rule | Description |
|------|-------------|
| Annual Entitlement | Per leave type allocation |
| Carry Forward Rules | Maximum accumulation limit |
| Encashment Policy | Leave payout rules |
| Lapse Rules | Year-end expiry |
| Pro-rata for New Joiners | Partial year calculation |
| Accrual Rules | Monthly/quarterly/annual credit |
| Negative Balance | Allow/disallow with limits |
| Approval Hierarchy | Escalation matrix |
| Maximum Consecutive Days | Per leave type limit |
| Holiday Calendar | National + Regional + Optional |

---

## 7. Payroll Calculation Engine

### 7.1 Step-by-Step Calculation Flow

**Step 1: Determine Payroll Period**
- Pay Period: 1st to 30th/31st OR 26th to 25th
- Attendance cut-off date
- Pay date (salary credit date)

**Step 2: Import Attendance Data**
- Fetch from biometric/attendance system
- Apply leave approvals
- Calculate: Paid Days, LOP Days, OT Hours

**Step 3: Calculate Per-Day Salary**

Methods:
- Fixed 30 days: Monthly Salary / 30
- Actual days: Monthly Salary / Calendar Days
- Fixed 26 days: Monthly Salary / 26

**Step 4: Calculate Gross Earnings**

For each component:
= (Monthly Amount / Total Payable Days) x Paid Days
+ Overtime Amount
+ Arrears (if any)
+ Bonus/Incentive (if any)
+ Reimbursements
= Gross Salary

**Step 5: Calculate Deductions**

- EPF Employee (12% of earned Basic + DA)
- ESI Employee (0.75% if applicable)
- Professional Tax (as per state slab)
- TDS (as per projected annual income)
- Loan EMI / Advance Recovery
- Other deductions
= Total Deductions

**Step 6: Calculate Net Salary**

Net Pay = Gross Salary - Total Deductions

**Step 7: Calculate Employer Cost**

CTC/Month = Gross + EPF(ER) + ESI(ER) + Gratuity + Insurance + Other ER contributions

**Step 8: Apply Rounding Rules**

- Round to nearest rupee (floor / ceil / nearest)
- Fraction handling for last month/component

---

## 8. Income Tax (TDS) Calculation

### 8.1 Tax Regime Comparison

**Old Regime Deductions:**
- Section 80C (1.5L): EPF, PPF, LIC, ELSS, NSC, Tuition Fees
- Section 80CCD(1B) (50K): NPS additional
- Section 80D: Medical Insurance (Self: 25K, Senior: 50K, Parents: 25K)
- Section 80E: Education Loan Interest
- Section 24(b): Home Loan Interest (2L)
- HRA Exemption: Min of actual HRA, 50%/40% of Basic, Rent Paid - 10% of Basic
- Standard Deduction: 50,000
- LTA Exemption: Actual travel bills

**New Regime (FY 2024-25):**
- Standard Deduction: 75,000
- Employer NPS u/s 80CCD(2): 14% of Basic
- No HRA, 80C, 80D exemptions
- Rebate u/s 87A: Up to 7L income

**New Regime Tax Slabs:**
| Income Range | Tax Rate |
|-------------|----------|
| 0 - 3,00,000 | Nil |
| 3,00,001 - 7,00,000 | 5% |
| 7,00,001 - 10,00,000 | 10% |
| 10,00,001 - 12,00,000 | 15% |
| 12,00,001 - 15,00,000 | 20% |
| Above 15,00,000 | 30% |

Plus Surcharge (if income > 50L) and Health & Education Cess: 4%

### 8.2 Monthly TDS Calculation

1. Project Annual Gross Income
2. Less: Exemptions & Deductions
3. = Taxable Income
4. Calculate Annual Tax
5. Monthly TDS = Annual Tax / Remaining Months
6. Adjust for previous months' TDS already deducted
7. Consider other income declared by employee
8. Consider previous employer salary (mid-year join)

---

## 9. Overtime (OT) Calculation

**Standard OT Rate = (Basic + DA) / 26 / 8 x 2**

### OT Eligibility Rules

- Minimum hours before OT starts
- Maximum OT hours per day/week/month
- Manager approval required
- Different rates for holidays and rest days

### OT Calculation Methods

| Method | Description |
|--------|-------------|
| Daily OT | Hours beyond shift |
| Weekly OT | Hours beyond 48 hours |
| Rest Day OT | 2x or 3x rate |
| Holiday OT | Holiday work rate |
| Night Shift Differential | Additional night rate |

---

## 10. Loss of Pay (LOP) Calculation

LOP Per Day = Gross Salary / Paid Days in Month

### Components Affected by LOP

| Component | LOP Applicable |
|-----------|---------------|
| Basic | Yes (always) |
| HRA | Yes (usually) |
| DA | Yes |
| Special Allowance | As per company policy |
| Fixed Allowances | Usually yes |
| Reimbursements | Usually no |
| Performance Bonus | Usually no |

### LOP Impact

| Area | Impact |
|------|--------|
| PF calculation | Reduced basic |
| ESI calculation | Reduced gross |
| Gratuity | LOP period not counted |
| Leave accrual | No credit for LOP month |
| Bonus eligibility | May be affected |

---

## 11. Arrears Calculation

### Scenarios Requiring Arrears

| Scenario | Calculation |
|----------|-------------|
| Salary Revision (backdate) | (New - Old Salary) x Backdate Months |
| LOP Reversal | Reversed LOP amount |
| Allowance Revision | Difference x back months |
| Grade/Designation Change | New vs old rate difference |
| Minimum Wages Revision | Statutory rate adjustment |

### Arrears Impact

- PF arrears also calculated
- ESI arrears (if applicable)
- Tax impact (Section 89(1) relief available)
- PT impact recalculation

---

## 12. Full & Final Settlement (F&F)

### Payable to Employee

| Component | Description |
|-----------|-------------|
| Last Working Month Salary | Pro-rata calculation |
| Earned Leave Encashment | (Basic + DA) / 26 x Unused EL Days |
| Gratuity (if 5+ years) | 15 x Last Basic / 26 x Years of Service |
| Bonus | Pro-rata for the year |
| Reimbursement Pending Claims | Outstanding claims |
| Notice Period Pay | If company waives |
| Expense Claims | Pending expense approvals |
| Variable Pay/Incentive | Pending payouts |
| PF Final Settlement | Via EPFO separately |

### Recoverable from Employee

| Component | Description |
|-----------|-------------|
| Notice Period Recovery | If notice not served |
| Pending Loan/Advance | Outstanding balance |
| Training Bond Amount | Bond recovery |
| Excess Leave Taken | Negative balance |
| Company Assets Not Returned | Laptop, phone, ID card |
| Joining Bonus Recovery | If within lock-in period |

### F&F Documents

- F&F Statement / Calculation Sheet
- Experience / Relieving Letter
- Form 16 (Part A + Part B)
- PF Transfer / Withdrawal Form
- Gratuity Form I/F
- No Dues Certificate
- Last Payslip

### F&F Timeline

| Activity | Timeline |
|----------|----------|
| Standard processing | 30-45 days from LWD |
| Some states mandate | Within 2 working days |
| Gratuity payment | Within 30 days (as per Act) |

---

## 13. Statutory Compliance & Filings

### PF Compliance

| Activity | Timeline |
|----------|----------|
| Monthly ECR Filing | By 15th of next month |
| Payment | By 15th of next month |
| New Member Registration | Form 11 / UAN generation |
| PF Transfer | Form 13 |
| PF Withdrawal | Form 19/10C/31 |
| Annual Return | As per EPFO schedule |

### ESI Compliance

| Activity | Timeline |
|----------|----------|
| Half-yearly contribution filing | April-September, October-March |
| Monthly payment | By 15th of next month |
| New IP Registration | On eligibility |

### Income Tax Compliance

| Activity | Timeline |
|----------|----------|
| Monthly TDS deposit | By 7th of next month |
| Quarterly TDS Return (Form 24Q) | Q1: Jul 31, Q2: Oct 31, Q3: Jan 31, Q4: May 31 |
| Form 16 Generation | By June 15 |
| Form 12BA (Perquisites Statement) | Annual |

### Professional Tax Compliance

- Monthly/Annual filing (state-wise)
- Enrollment Certificate (EC)
- Registration Certificate (RC)
- Annual return filing

### Other Compliances

- Shops & Establishment Act
- Minimum Wages Act
- Payment of Wages Act
- Payment of Bonus Act
- Payment of Gratuity Act
- Maternity Benefit Act
- Equal Remuneration Act
- Labour Welfare Fund (LWF) filing
- Factory Act (manufacturing units)
- Contract Labour Act
- POSH Act compliance

---

## 14. Reports & Outputs

### Salary Reports

| Report | Description |
|--------|-------------|
| Individual Payslip | Per employee monthly statement |
| Salary Register | All employees consolidated |
| Salary Sheet | Department/location wise |
| Bank Transfer Statement | Bank advice file |
| CTC Report | Monthly and annual cost |
| Salary Comparison Report | Month-on-month variance |
| Headcount Report | With salary details |

### Statutory Reports

| Report | Description |
|--------|-------------|
| PF Report (ECR format) | EPFO-compliant |
| ESI Report | ESIC-compliant |
| PT Report | State-wise format |
| TDS Report / Challan | Tax deposit evidence |
| Form 24Q Data | Quarterly TDS return |
| Form 16 (Part A & B) | Annual tax certificate |
| Form 12BA | Perquisites statement |

### MIS Reports

| Report | Description |
|--------|-------------|
| Payroll Summary Dashboard | Executive overview |
| Year-to-Date (YTD) Report | Cumulative analysis |
| Employer Cost Report | Complete cost breakdown |
| Attrition vs Payroll Cost | Turnover cost analysis |
| Overtime Analysis | OT cost and hours |
| Leave Analysis | Utilization patterns |
| LOP Analysis | Unpaid leave trends |
| Budget vs Actual | Manpower cost comparison |
| Projection Report | Future cost estimates |

### Accounting Reports

| Report | Description |
|--------|-------------|
| Journal Voucher | Salary booking entry |
| GL (General Ledger) Mapping | Chart of accounts |
| Payroll Provision Report | Accruals tracking |
| TDS Liability Report | Tax payable |
| PF/ESI Liability Report | Statutory payable |
| Department-wise Cost Allocation | Cost center distribution |

---

## 15. Payslip Components

```
COMPANY NAME & LOGO
PAYSLIP FOR THE MONTH OF XXXXX 2024

Employee ID    : EMP001        Department  : IT
Name           : Employee Name Designation : Sr. Developer
DOJ            : 01-Apr-2020   Location    : Mumbai
PAN            : XXXXX1234X    Bank A/c    : XXXX5678
UAN            : 1001234567    PF No       : MH/1234
Pay Days       : 30            LOP Days    : 2
Paid Days      : 28            OT Hours    : 8

EARNINGS                     DEDUCTIONS
--------------------        --------------------
Basic       : 25,000        EPF         : 3,000
HRA         : 12,500        ESI         :   375
DA          :  2,500        Prof. Tax   :   200
Conveyance  :  1,600        TDS         : 4,500
Medical     :  1,250        Loan EMI    : 5,000
Special     :  5,000        Canteen     :   500
OT Pay      :  2,000        LOP Dedn    : 3,323
Arrears     :  1,500
--------------------        --------------------
Gross Earn  : 51,350        Total Dedn : 16,898

NET PAY: 34,452/-

EMPLOYER CONTRIBUTIONS:
EPF (ER) : 3,000    ESI (ER) : 1,625
Gratuity : 1,202    Insurance: 500

YTD SUMMARY:
Total Earnings: 4,50,000  Total Tax: 45,000
Total PF     : 30,000     Total ESI: 3,750

LEAVE BALANCE:
CL: 3  SL: 4  EL: 12  Comp Off: 1
```

---

## 16. System Features & Technical Requirements

### Core Features

| Feature | Description |
|---------|-------------|
| Multi-company support | Single instance, multiple companies |
| Multi-location / Multi-state | Geographical distribution |
| Multi-currency | For expats/overseas employees |
| Multiple pay groups | Different pay frequencies |
| Configurable salary structures | Template-based |
| Maker-Checker | Two-person approval for processing |
| Payroll Lock/Unlock | Processing control |
| Payroll comparison | Before finalization review |
| Bulk upload/import | Excel/CSV support |
| Supplementary payroll | Off-cycle runs |
| Payroll calendar | Schedule management |

### User Roles & Access

| Role | Access Level |
|------|-------------|
| Super Admin | Full system access |
| HR Admin | Employee data, attendance |
| Payroll Admin | Payroll processing |
| Finance/Accounts | Reports, disbursement |
| Manager | Team reports view |
| Employee Self Service | Payslip, Form 16, declarations |
| Auditor | Read-only access |

### Employee Self Service (ESS) Features

- View payslip
- Download Form 16
- Submit IT Declaration
- Submit Reimbursement Claims
- View Tax Computation
- View Leave Balance
- View Loan Balance
- Update Bank Details

### Security Features

| Feature | Description |
|---------|-------------|
| Role-based Access Control (RBAC) | Granular permission model |
| Data Encryption | At rest and in transit |
| Two-Factor Authentication (2FA) | Additional security layer |
| Audit Trail / Activity Log | Complete traceability |
| IP Whitelisting | Network restriction |
| Session Timeout | Auto-logout |
| Password Policy | Complexity, expiry, history |
| Data Masking | PAN, Aadhaar, Bank Account |
| Backup & Disaster Recovery | Data protection |

### Integrations

| Integration | Purpose |
|-------------|---------|
| Biometric/Attendance System | Automated attendance import |
| HRMS / HRIS | Employee master sync |
| Leave Management System | Leave data import |
| Accounting Software (Tally, SAP, Oracle) | Journal entries |
| Banking Portal | Salary transfer |
| EPFO Portal | PF filing |
| ESIC Portal | ESI filing |
| Income Tax Portal (TRACES) | TDS reconciliation |
| Email/SMS Gateway | Payslip distribution |
| Digital Signature | Form 16 signing |

### Automation Features

| Feature | Description |
|---------|-------------|
| Auto salary structure | Based on CTC input |
| Auto PF/ESI threshold check | Eligibility verification |
| Auto PT slab application | State-wise mapping |
| Auto TDS calculation | Monthly adjustment |
| Auto arrears | On salary revision |
| Auto leave accrual | Monthly/periodic credit |
| Auto LOP calculation | From attendance data |
| Auto payslip email | Scheduled distribution |
| Auto statutory reminders | Filing deadlines |
| Auto Form 16 generation | Year-end processing |

---

## 17. Payroll Processing Workflow

### Day 1-25: Data Collection Phase

- HR updates: New joiners, exits, transfers
- Attendance regularization deadline
- Leave approval completion
- Salary revision/increment inputs
- Bonus/Incentive inputs from managers
- Loan/Advance approval
- Reimbursement claims submission
- IT declaration updates
- Investment proof collection (Jan-Feb)

### Day 25-26: Attendance Freeze

- Lock attendance for the month
- Generate attendance summary
- Share with managers for verification
- Handle exceptions and corrections

### Day 26-27: Payroll Processing

- Import attendance data
- Input variable components (OT, Bonus, etc.)
- Input one-time additions/deductions
- Run payroll calculation
- Generate variance report
- Review and identify discrepancies

### Day 27-28: Verification & Approval

- Payroll Manager reviews
- HR Head verifies
- Finance Head approves
- Management/Director final sign-off
- Maker-Checker completion

### Day 28-30: Disbursement

- Generate bank transfer file (NEFT/RTGS/NACH)
- Upload to banking portal
- Salary credited to employees
- Generate and distribute payslips
- Email/Portal notification

### Day 1-7 (Next Month): Post-Payroll

- Deposit PF/ESI by 15th
- Deposit TDS by 7th
- File statutory returns
- Payroll accounting entries
- Archive payroll data
- Reconciliation

---

## 18. Special Scenarios (Edge Cases)

| Scenario | Handling |
|----------|----------|
| Mid-Month Joining | Pro-rata: Monthly Salary / Total Days x Paid Days |
| Mid-Month Exit | Pro-rata + F&F calculation |
| Transfer between locations | PT slab change, HRA % change, holiday calendar |
| Salary Revision with Backdate | Arrears + PF arrears + tax recomputation |
| Long Leave (>1 month) | PF/ESI handling during zero-pay months |
| Deceased Employee | F&F to nominee, gratuity, insurance claim |
| Rehire/Rejoin | PF number continuity, service tracking |
| Negative Net Pay | Deductions exceeding earnings, recovery plan |
| Expatriate/Foreign National | TDS u/s 192, DTAA benefits, social security |
| Dual Employment | Multiple Form 16, PF from both employers |
| Minimum Wages Check | State-wise, employment category, zone classification |
| Contractual/Third-Party | Agency fee, GST, compliance responsibility |
| Notice Period Scenarios | Full notice, buyout, garden leave, extended |
| Salary Hold | BGV pending, disciplinary, no-dues |
| Pay Correction/Reversal | Overpayment recovery, underpayment correction |

---

## 19. Accounting Entries (Payroll Journal)

### Salary Booking Entry

**Debit:**
- Salary & Wages Account (P&L - Expense)
- EPF Employer Contribution (P&L - Expense)
- ESI Employer Contribution (P&L - Expense)
- Gratuity Expense Account (P&L - Expense)
- Bonus Expense Account (P&L - Expense)

**Credit:**
- Salary Payable Account (BS - Liability)
- EPF Payable Account (BS - Liability) - Employee + Employer
- ESI Payable Account (BS - Liability) - Employee + Employer
- TDS Payable Account (BS - Liability)
- Professional Tax Payable (BS - Liability)
- LWF Payable Account (BS - Liability)
- Loan Recovery Account (BS - Asset reduction)
- Other Deductions Account (BS - Liability)

### On Payment (Bank Transfer)

**Debit:** Salary Payable Account
**Credit:** Bank Account

### On Statutory Payment

**Debit:** EPF Payable / ESI Payable / TDS Payable
**Credit:** Bank Account

### Provision Entries

- Gratuity Provision (Actuarial Valuation based)
- Leave Encashment Provision
- Bonus Provision
- Salary Accrual (if pay date is next month)

---

## 20. Annual Activities Calendar

| Month | Activities |
|-------|------------|
| April | Reset IT declarations, apply new tax slabs, update minimum wages, annual increments, new CTC letters |
| June | Form 16 generation and distribution (by June 15), previous FY TDS return final filing |
| July | Q1 TDS return (24Q) filing |
| September | Half-yearly ESI return, mid-year IT projection review |
| October | Q2 TDS return, bonus calculation and payment |
| January-February | Investment proof collection, rent receipts, final IT declaration, tax regime finalization, Q3 TDS return |
| March | Year-end TDS reconciliation, leave lapse/carry forward, EL encashment, annual PF/ESI return, gratuity valuation, annual labour law returns, budget preparation |

---

## 21. Validation & Audit Checks

### Pre-Payroll Checks

- All new joiners added with complete data
- All exits processed
- Attendance data imported correctly
- Leave balance sufficient for leaves taken
- Salary structure approved for all
- No duplicate employee IDs
- Bank details verified for new accounts
- IT declarations received
- Variable inputs (OT, Bonus) approved
- Salary revision inputs applied

### Post-Payroll Checks

- Net Pay >= 0 for all employees
- PF calculated on correct base
- ESI threshold checked
- PT as per correct state slab
- TDS reasonable (not too high/low)
- Gross = Sum of all earnings
- Net Pay = Gross - Total Deductions
- Total bank transfer = Sum of all Net Pay
- Headcount matches between HR and Payroll
- No salary for terminated employees
- Pro-rata correct for mid-month join/exit
- Minimum wages compliance met
- Loan EMI deducted correctly
- Arrears calculated correctly
- LOP deduction matches attendance report
- Variance from last month within acceptable range
- Total Cost = Gross + Employer contributions

### Reconciliation

- PF challan amount = PF report total
- ESI challan = ESI report total
- TDS challan = Form 24Q quarterly data
- Bank statement = Salary payable amount
- GL entries = Payroll register totals
- Form 16 YTD = Actual salary paid

---

## 22. Perquisites & Non-Monetary Benefits (Taxation)

### Taxable Perquisites (Form 12BA)

| Perquisite | Valuation Method |
|------------|------------------|
| Company-provided accommodation | 15%/10%/7.5% of salary (city-wise) |
| Company car for personal use | As per prescribed rates |
| Interest-free/concessional loan | SBI rate - Actual rate |
| Club membership | Actual cost |
| Stock Options (ESOPs/RSUs) | FMV - Exercise Price |
| Gift/Vouchers (> 5,000 aggregate) | Actual value |
| Domestic servant | Employer cost |
| Education facility (> 1,000/month/child) | Cost incurred |

### Exempt Perquisites

- Laptop/Computer for official use
- Leave Travel Concession (with conditions)
- Medical treatment abroad (with limits)
- Refreshments during office hours
- Phone/Internet for official use
- Training/Skill development

---

## 23. Data Management & Archival

### Data Storage Requirements

- Monthly payroll data archive
- Employee master version history
- Salary revision history
- Amendment log (who changed what, when)
- Payslip PDF storage
- Form 16 storage (7+ years)
- Statutory filing acknowledgments
- Investment proof documents
- Loan agreements
- F&F settlement documents

### Retention Policy

| Record Type | Retention Period |
|-------------|------------------|
| Payroll records | 8-10 years minimum |
| Tax records | 8 years from assessment year |
| PF records | Permanent (until member retires) |
| Gratuity records | 5 years after payment |
| Employee files | 3 years after exit |

---

## 24. Common Formulas Reference

| Formula | Calculation |
|---------|-------------|
| Per Day Salary (30-day method) | Monthly Gross / 30 |
| LOP Deduction | Per Day Salary x LOP Days |
| Earned Salary | (Monthly Salary / Total Payable Days) x Paid Days |
| PF (Employee) | 12% x (Earned Basic + Earned DA); max base 15,000 |
| PF (Employer) | 12% x (Earned Basic + Earned DA); EPS = 8.33% (max 15K), EPF = 3.67% |
| ESI (Employee) | 0.75% x Gross (if Gross <= 21,000) |
| ESI (Employer) | 3.25% x Gross (if Gross <= 21,000) |
| Gratuity | (15 x Last Basic+DA x Years of Service) / 26 |
| OT Rate | (Basic + DA) / 26 / 8 x 2 x OT Hours |
| Leave Encashment | (Basic + DA) / 30 x Encashable Leave Days |
| HRA Exemption (Old) | Min of: Actual HRA, 50%/40% of Basic, Rent Paid - 10% of Basic |
| Bonus (Statutory) | (Basic + DA) x 8.33% to 20%; ceiling: 7,000/month |
| CTC Calculation | Gross + EPF(ER) + ESI(ER) + Gratuity + Insurance + Other ER |
| Take Home | Gross - EPF(EE) - ESI(EE) - PT - TDS - Other Deductions |

---

## 25. Notifications & Communications

### To Employees

| Notification | Channel |
|-------------|---------|
| Salary credited | Email + SMS |
| Payslip available | Email |
| IT Declaration reminder | Email + SMS |
| Investment proof submission reminder | Email |
| Tax regime selection reminder | Email |
| Form 16 available | Email |
| Loan EMI deduction notification | Email |
| Leave balance notification | Email |
| F&F settlement intimation | Email |
| Salary revision letter | Email |
| LOP notification | Email |

### To Management

| Notification | Channel |
|-------------|---------|
| Payroll processed | Email |
| Compliance due date reminders | Email |
| Headcount & cost dashboard | Portal |
| Anomaly/Exception alerts | Email |
| Budget variance alerts | Email |

### To Finance

| Notification | Channel |
|-------------|---------|
| Salary disbursement request | Email |
| Statutory payment reminders | Email |
| Accounting entries ready | Email |

---

## 26. Go-Live Checklist

| # | Item | Status |
|---|------|--------|
| 1 | All employees migrated with correct data | |
| 2 | Salary structures configured | |
| 3 | Tax regime selected by all employees | |
| 4 | IT declarations collected | |
| 5 | PF/ESI numbers mapped | |
| 6 | Bank details verified | |
| 7 | Attendance system integrated | |
| 8 | Leave policies configured | |
| 9 | Holiday calendar uploaded | |
| 10 | PT state mapping completed | |
| 11 | Loan balances migrated | |
| 12 | YTD salary data migrated (mid-year go-live) | |
| 13 | Previous employer Form 12B collected | |
| 14 | Approval workflows set up | |
| 15 | Parallel payroll run completed (1-2 months) | |
| 16 | Variance with old system analyzed and resolved | |
| 17 | Payslip template finalized | |
| 18 | Report templates finalized | |
| 19 | User training completed | |
| 20 | UAT signed off | |
| 21 | Data backup & recovery tested | |
| 22 | Access controls verified | |
| 23 | Statutory format compliance verified | |
| 24 | GL mapping with accounts finalized | |

---

## System Overview Diagram

```
                    EMPLOYEE DATA
                    (Master Info)
                          |
              -------------------------------
              |               |              |
     ATTENDANCE          SALARY           TAX
     & LEAVE            STRUCTURE       DECLARATIONS
     MANAGEMENT          (CTC)         & COMPLIANCE
              |               |              |
              -------------------------------
                          |
                    PAYROLL ENGINE
                    (Calculation)
                          |
           --------------------------------+
           |                               |
     SALARY PAYMENT              STATUTORY FILINGS
     (Bank Transfer)             (PF/ESI/TDS/PT)
           |
     REPORTS & ANALYTICS
     (MIS / Payslip)
```

---

## Best Practices for Accurate Salary Processing

1. Always run parallel payroll for the first 2-3 months
2. Always use a maker-checker approval process
3. Never process payroll without attendance freeze
4. Always reconcile PF/ESI/TDS with actual challan payments
5. Always maintain audit trail of every change
6. Maintain version history of salary structures
7. Test edge cases (mid-month join, full-month LOP, etc.)
8. Automate as much as possible to reduce manual entry
9. Document all payroll policies clearly
10. Review statutory rates every April (new financial year)
