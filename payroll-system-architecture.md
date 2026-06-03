# Payroll System Architecture

**Version 1.0 | Policy-Driven + Compliance-Aware Architecture**

---

## System Philosophy

The payroll system operates on a dual-mode architecture:

**Execution Mode** -- The system executes company-defined policies without deviation. Whatever the company configures is what gets calculated. No overrides, no questions.

**Compliance Mode** -- The system records every transaction, identifies statutory risks, generates compliance reports, highlights regulatory gaps, and preserves a complete audit trail.

**Result** -- Full operational control for the company with complete regulatory protection.

---

## Section 1: System Architecture Overview

### Payroll System Layers

```
LAYER 1: MASTER DATA
(Employee + Company + Location + Department)
         |
LAYER 2: POLICY CONFIGURATION ENGINE
(Rules + Formulas + Slabs + Eligibility)
[Execution Mode - Company decides everything here]
         |
LAYER 3: INPUT DATA
(Attendance + Leave + OT + Variable + Adjustments)
         |
LAYER 4: CALCULATION ENGINE
(Gross + Deductions + Net + Employer Cost)
         |
LAYER 5: COMPLIANCE ENGINE (Compliance Mode)
(Statutory Check + Risk Alert + Gap Report)
         |
LAYER 6: OUTPUT
(Salary Sheet + Payslip + Bank File + Reports)
         |
LAYER 7: AUDIT TRAIL
(Every action logged with who/what/when/why)
```

---

## Section 2: Master Data Module

### 2.1 Company Master

| Field | Description |
|-------|-------------|
| Company Name, Logo, Address | Basic company information |
| CIN / GSTIN / TAN / PAN | Legal registration identifiers |
| PF Establishment Code | Provident Fund registration |
| ESI Code | Employee State Insurance registration |
| PT Registration Number | Professional Tax (state-wise) |
| LWF Registration | Labour Welfare Fund registration |
| Shops & Establishment License | Local business license |
| Factory License | Applicable for manufacturing units |
| Financial Year | April-March or Jan-Dec |
| Pay Cycle | Monthly / Weekly / Bi-weekly |
| Pay Period | 1st-30th / 26th-25th / Custom |
| Salary Credit Date | Last day / 1st / 7th / Custom |
| Currency | INR (default) |
| Multi-location | Yes/No |
| Multi-state | Yes/No |

#### Policy-Driven Configuration

| Config Key | Options | Default |
|------------|---------|---------|
| per_day_calc_method | 30 / actual / 26 | 30 |
| lop_calc_method | 30 / actual / 26 | 30 |
| rounding_final_salary | floor / ceil / nearest | nearest |
| rounding_precision | 0 / 1 / 2 decimals | 0 |
| negative_net_pay_allow | yes / no | no |
| arrears_auto_calculate | yes / no | yes |
| multi_bank_split | yes / no | no |
| maker_checker_enabled | yes / no | yes |

#### Compliance Mode Features

- Stores statutory registration validity dates
- Alerts 30 days before registration expiry
- Generates compliance registration status report

---

### 2.2 Employee Master

#### Personal Information

- Employee ID (auto/manual generation)
- Full Name (as per PAN)
- Father/Spouse Name
- Date of Birth, Gender, Marital Status
- Blood Group, Nationality
- Contact: Phone, Email, Address
- Emergency Contact
- Photo

#### Employment Information

- Date of Joining (DOJ)
- Date of Confirmation
- Probation End Date
- Department, Designation, Grade/Band
- Location/Branch/Plant
- Reporting Manager
- Cost Center / Project Code
- Employment Type: Permanent / Contractual / Probation / Trainee / Part-time / Consultant / Daily-wage / Intern
- Employee Category: Worker / Staff / Supervisor / Manager / Director
- Shift Assignment
- Weekly Off Pattern
- Notice Period (days)
- Pay Group

#### Statutory Information

- PAN Number
- Aadhaar Number
- UAN (PF)
- PF Number
- PF Eligibility: Yes/No
- PF Contribution Type: Ceiling (15K) / Actual Basic
- ESI Number
- ESI Eligibility: Auto (based on gross threshold)
- PT State
- Tax Regime: Old / New
- Gratuity Eligible: Auto (5+ years) / Manual Override
- NPS Account: Yes/No
- LWF Applicable: Yes/No

#### Bank Information

- Primary Bank: Name, Branch, Account No, IFSC
- Secondary Bank (for split salary): Same fields
- Split Percentage: Primary / Secondary
- Payment Mode: Bank Transfer / Cheque / Cash

#### Exit Information

- Resignation Date
- Last Working Day
- Exit Type: Resignation / Termination / Absconding / Retirement / Death
- Notice Served: Full / Partial / Buyout
- Full & Final Status: Pending / Processed / Paid

#### Policy-Driven Configuration (Per Employee Override)

| Config Key | Default | Override |
|------------|---------|----------|
| ot_eligible | yes | per employee |
| pf_on_actual_basic | no (15K cap) | per employee |
| salary_hold | no | per employee |
| bonus_eligible | yes | per employee |
| leave_eligible | yes | per employee |
| night_shift_allowance | no | per employee |

#### Compliance Mode Features

- Tracks employee category vs OT eligibility mismatch
- Alerts when PF-eligible employee lacks UAN
- Alerts on incomplete statutory fields
- Generates employee data completeness score
- Maintains field change history with old/new values

---

## Section 3: Salary Structure Module (CTC Design)

### 3.1 Component Master

Every salary component has the following properties:

| Property | Options / Values |
|----------|------------------|
| Component Code | BASIC, HRA, DA, SA, etc. |
| Component Name | Display name |
| Type | Earning / Deduction / Employer Cost |
| Sub-Type | Fixed / Variable / Reimbursement |
| Taxable | Yes / No / Partial / Exempt |
| Part of Gross | Yes / No |
| Part of CTC | Yes / No |
| PF Applicable | Yes / No |
| ESI Applicable | Yes / No |
| PT Applicable | Yes / No |
| Bonus Applicable | Yes / No |
| OT Base | Yes / No |
| LOP Applicable | Yes / No |
| Arrears Applicable | Yes / No |
| Pro-rata on Join | Yes / No |
| Show on Payslip | Yes / No |
| Calculation Type | Fixed / % of Basic / % of Gross / % of CTC / Formula / Slab |
| Calculation Value | Amount or Percentage |
| Frequency | Monthly / Quarterly / Annual |
| Effective From | Date |
| Active | Yes / No |

#### Execution Mode

Company decides every property per component. System blindly follows configured rules.

#### Compliance Mode Flags

- Basic below 40% of Gross: PF liability may be higher than expected
- HRA provided without rent declaration: Potential tax risk
- Component marked non-taxable but legally taxable
- PF base components below statutory minimum

---

### 3.2 Salary Structure Templates

The system supports multiple configurable templates. Example structure:

**Template: STAFF_MONTHLY_MUMBAI**

| Component | Calc Type | Value | Monthly Amount |
|-----------|-----------|-------|----------------|
| Basic | % of CTC | 40% | Auto-calculated |
| HRA | % of Basic | 50% | Auto-calculated |
| DA | % of Basic | 10% | Auto-calculated |
| Conveyance | Fixed | 1,600 | 1,600 |
| Medical | Fixed | 1,250 | 1,250 |
| Special Allowance | Balancing | Auto | Remaining amount |
| EPF (Employee) | % of Basic+DA | 12% | Auto-calculated |
| EPF (Employer) | % of Basic+DA | 12% | Auto-calculated |
| ESI (Employee) | % of Gross | 0.75% | Auto-calculated |
| ESI (Employer) | % of Gross | 3.25% | Auto-calculated |
| Gratuity | % of Basic | 4.81% | Auto-calculated |
| Insurance | Fixed | 500 | 500 |

#### Execution Mode Configuration

| Setting | Company Decides |
|---------|-----------------|
| basic_percentage | 30% / 40% / 50% / custom |
| hra_base | basic / basic+da / fixed |
| hra_metro_rate | 50% / 40% / custom |
| pf_base | basic / basic+da / gross |
| pf_ceiling | 15000 / actual / custom |
| esi_threshold | 21000 / custom |
| gratuity_formula | standard / custom |
| balancing_component | special_allow / other |
| ctc_includes | pf+esi+gratuity+insurance |

#### Compliance Mode: Statutory vs Company Comparison

| Parameter | Statutory | Company Config | Status |
|-----------|-----------|----------------|--------|
| Basic | 40%+ recommended | 30% | Below Recommendation |
| PF Base | 15000 | 15000 | Compliant |
| Minimum Wages | 12,000 | 10,000 | Breach |
| Gratuity | 4.81% | 4.81% | Compliant |

---

## Section 4: Attendance & Leave Configuration

### 4.1 Attendance Configuration

#### Execution Mode - Company Decides All Rules

| Config Key | Options | Default |
|------------|---------|---------|
| shift_start_time | HH:MM | 09:00 |
| shift_end_time | HH:MM | 18:00 |
| break_duration_min | Minutes | 60 |
| min_working_hours | Hours | 8 |
| grace_period_minutes | 0/5/10/15/30 | 15 |
| grace_applicable_times | per day / per month | 3/month |
| late_mark_after_min | Minutes | 15 |
| half_day_mark_after_min | Minutes | 120 |
| absent_mark_after_min | Minutes | 240 |
| late_to_absent_rule | X late = Y absent | 3 = 1 |
| late_to_halfday_rule | X late = Y half day | 3 = 0.5 |
| early_going_threshold | Minutes | 30 |
| short_leave_hours | Hours | 2 |
| short_leave_max_month | Count | 2 |
| auto_absent_if_no_punch | yes / no | yes |
| regularization_allowed | yes / no | yes |
| regularization_deadline | Days | 3 |
| weekend_pattern | Sat-Sun / Sun / Alternate | Sat-Sun |
| sandwich_rule | yes / no | yes |
| comp_off_earn_rule | holiday_work / overtime / both | both |
| comp_off_validity_days | Days | 30 |
| wfh_attendance_mode | auto / manual / gps | manual |

#### Compliance Mode Tracking

- Employees with more than 5 LOPs in a month
- Attendance edit and override history
- Regularization approval patterns
- Late marking vs actual biometric discrepancy
- Working hours below minimum wages threshold
- Monthly attendance anomaly report

---

### 4.2 Leave Policy Configuration

#### Execution Mode - Per Leave Type Configuration

| Leave Type | Annual Credit | Carry Forward | Max Accumulation | Encashable | Accrual Method |
|------------|--------------|---------------|------------------|------------|----------------|
| CL | 7 | No | 7 | No | Annual |
| SL | 7 | No | 7 | No | Annual |
| EL | 15 | Yes | 45 | Yes | Monthly (1.25) |
| ML | 182 | N/A | 182 | No | As needed |
| PL | 5 | No | 5 | No | Annual |
| Comp Off | Earned | No | 3 | No | On earning |
| LWP | N/A | N/A | No cap | No | N/A |

#### Additional Leave Rules

| Config Key | Value |
|------------|-------|
| probation_leave_eligible | no / partial / yes |
| notice_period_leave_allow | no / el_only / all |
| negative_balance_allow | no / yes (max X days) |
| half_day_leave_allow | yes / no |
| medical_cert_after_days | 2 / 3 / custom |
| max_consecutive_cl | 2 / 3 / custom |
| el_encash_min_balance | 15 / 30 / custom |
| lapse_date | Dec 31 / Mar 31 / custom |
| joiner_prorata_method | monthly / quarterly |
| clubbing_restriction | CL+SL not allowed, etc. |

#### Compliance Mode Flags

- EL credit below state minimum
- Maternity leave below 26 weeks
- No CL/SL provided to eligible worker
- Leave utilization vs entitlement report

---

## Section 5: Overtime (OT) Module

### Execution Mode Configuration

| Config Key | Options | Default |
|------------|---------|---------|
| **Eligibility** | | |
| ot_enabled | yes / no | yes |
| ot_eligible_emp_types | worker / staff / all | worker |
| ot_eligible_grades | G1, G2, G3... | G1-G3 |
| ot_approval_required | yes / no | yes |
| **Calculation** | | |
| ot_base_components | basic / basic+da / gross / fixed | basic |
| ot_per_hour_divisor | 26x8 / 30x8 / custom | 26x8 |
| ot_normal_day_multiplier | 1x / 1.25x / 1.5x / 2x / custom | 2x |
| ot_weekly_off_multiplier | 1x / 1.5x / 2x / 3x | 2x |
| ot_holiday_multiplier | 1x / 1.5x / 2x / 3x | 2x |
| ot_night_shift_multiplier | 1x / 1.5x / 2x | 1x |
| **Time Rules** | | |
| ot_min_threshold_minutes | 0 / 15 / 30 / 60 | 30 |
| ot_max_per_day_hours | 2 / 3 / 4 / unlimited | 4 |
| ot_max_per_week_hours | 12 / 20 / unlimited | 12 |
| ot_max_per_month_hours | 40 / 50 / unlimited | 50 |
| **Rounding** | | |
| ot_rounding_method | floor / ceil / nearest / exact | floor |
| ot_rounding_unit_minutes | 15 / 30 / 60 | 30 |

### OT Calculation Flow

1. System reads biometric OUT - IN time
2. Subtracts shift hours + break duration
3. Checks if remaining time exceeds minimum threshold
4. Applies rounding method and unit
5. Checks daily/weekly/monthly caps
6. Calculates: OT Pay = (OT Base / OT Divisor) x Multiplier x Hours
7. Validates approval status
8. Adds to payable earnings

### Compliance Mode: Parallel Report

| Employee | Raw OT Hours | Config OT Hrs | Paid OT Amount | Statutory OT Amount | Gap |
|----------|-------------|---------------|----------------|-------------------|-----|
| EMP001 | 12.5 | 12.0 | 2,400 | 3,000 | -600 |
| EMP002 | 8.75 | 8.5 | 1,700 | 2,100 | -400 |
| EMP003 | 15.25 | 15.0 | 3,000 | 3,660 | -660 |

This report shows:
- Actual raw OT from biometric data
- Configured/rounded OT that system paid
- Statutory payment requirement
- The difference (company savings / employee shortfall)

**Alerts:**
- OT multiplier below statutory minimum for Factory Act covered employees
- Monthly OT exceeding Factories Act limit for applicable employees

---

## Section 6: Loss of Pay (LOP) Module

### Execution Mode Configuration

| Config Key | Options | Default |
|------------|---------|---------|
| lop_per_day_base | 30 / actual / 26 | 30 |
| lop_components_affected | all_fixed / basic_only / selected | all |
| lop_impacts_pf | yes / no | yes |
| lop_impacts_esi | yes / no | yes |
| lop_impacts_bonus | yes / no | yes |
| lop_auto_from_attendance | yes / no | yes |
| lop_reversal_allowed | yes / no | yes |
| lop_reversal_deadline | next month / 2 months | next |

### LOP Calculation

Per Day Salary = Sum of LOP-applicable components / Base
LOP Deduction = Per Day Salary x LOP Days

### Compliance Mode Alerts

- Per-day base of 26 with 31-day month: Higher per-day cost
- Per-day base of 30 with 28-day month: Lower per-day pay
- LOP trend and financial impact reports

---

## Section 7: Statutory Deductions Configuration

### 7.1 PF Configuration

| Config Key | Options | Default |
|------------|---------|---------|
| pf_enabled | yes / no | yes |
| pf_employee_rate | 12% / custom | 12% |
| pf_employer_rate | 12% / custom | 12% |
| pf_base_components | basic / basic+da | basic |
| pf_ceiling_enabled | yes / no | yes |
| pf_ceiling_amount | 15000 / custom | 15000 |
| eps_rate | 8.33% | 8.33% |
| eps_ceiling_amount | 15000 | 15000 |
| vpf_enabled | yes / no | yes |

#### Compliance Mode Alerts
- PF not deducted for eligible employee
- PF base below statutory minimum
- Employer contribution below statutory rate
- PF contribution summary and ECR reconciliation reports

### 7.2 ESI Configuration

| Config Key | Options | Default |
|------------|---------|---------|
| esi_enabled | yes / no | yes |
| esi_employee_rate | 0.75% | 0.75% |
| esi_employer_rate | 3.25% | 3.25% |
| esi_threshold_gross | 21000 / custom | 21000 |
| esi_base | gross / custom | gross |
| esi_rounding | ceil / floor | ceil |

#### Compliance Mode Alerts
- Gross exceeding threshold while ESI still being deducted
- ESI-eligible employee not enrolled

### 7.3 Professional Tax Configuration

State-wise PT slabs are configurable. Example:

| State | Gross Slab | Monthly PT | February PT |
|-------|-----------|------------|-------------|
| Maharashtra | 0-7500 | 0 | 0 |
| Maharashtra | 7501-10000 | 175 | 300 |
| Maharashtra | 10001+ | 200 | 300 |
| Karnataka | 0-15000 | 0 | 0 |
| Karnataka | 15001+ | 200 | 200 |

#### Compliance Mode Alerts
- PT deducted but state registration missing
- February PT slab not applied

### 7.4 TDS / Income Tax Configuration

| Config Key | Options | Default |
|------------|---------|---------|
| tds_enabled | yes / no | yes |
| default_tax_regime | old / new | new |
| employee_regime_choice | yes / no | yes |
| tds_calc_method | projected_annual / ytd_based | projected |
| regime_lock_month | February / March | March |
| surcharge_applicable | auto | auto |
| cess_rate | 4% | 4% |
| 87a_rebate_auto | yes / no | yes |

#### IT Declaration Components

| Section | Description | Max Limit | Regime |
|---------|-------------|-----------|--------|
| 80C | EPF/PPF/LIC/ELSS, etc. | 1,50,000 | Old |
| 80CCD(1B) | NPS Additional | 50,000 | Old |
| 80CCD(2) | Employer NPS | 10%/14% | Both |
| 80D | Mediclaim | Slab-based | Old |
| 80E | Education Loan Interest | No limit | Old |
| 24(b) | Home Loan Interest | 2,00,000 | Old |
| HRA | HRA Exemption | Calculated | Old |
| Standard Deduction | Standard Deduction | 50K/75K | Both |

#### Compliance Mode Alerts
- TDS not deducted for taxable employee
- Year-end TDS shortfall exceeding threshold
- Tax regime not selected by employee
- Investment proof not submitted

---

## Section 8: Variable Inputs Module

Monthly variable inputs with configurable entry and approval workflows:

| Input Type | Entry Mode | Approval Required |
|-----------|------------|-------------------|
| Overtime Hours | Auto / Manual | Manager + Admin |
| Incentive / Bonus | Upload / Manual | HR + Finance |
| Commission | Upload / Manual | Manager |
| Arrears | Auto / Manual | Admin |
| Reimbursement Claims | Employee + Admin | Manager + Finance |
| Salary Advance | Manual | HR + Finance |
| Loan EMI | Auto | Auto |
| Ad-hoc Deduction | Manual | Admin + Finance |
| Ad-hoc Addition | Manual | Admin + Finance |
| Notice Period Recovery | Manual | HR + Finance |
| Salary Revision | Manual | HR + Management |
| LOP Reversal | Manual | HR + Admin |

### Compliance Mode Logging

Every variable input is logged with:
- Who entered and when
- Who approved and when
- Old value (if edited)
- Reason for change
- Monthly variable input summary
- Unusual or high-value input alerts

---

## Section 9: Payroll Calculation Engine

### Step-by-Step Calculation

**Step 1: Determine Pay Period**
- Pay month, calendar days, working days
- Payable days base (30 or actual, per config)
- Attendance cut-off date
- Pay date (last day / 1st / 7th, per config)

**Step 2: Fetch Employee Data**
For each active employee:
- Salary structure (all components + values)
- Employee category, grade, location
- PF/ESI/PT eligibility flags
- Tax regime + declarations
- Loan/advance balance
- Hold or special flags

**Step 3: Fetch Attendance Summary**
- Present days, paid leave days, weekly off days, holiday days
- LOP days, half-day count
- OT hours (raw + rounded)
- Total Paid Days = Present + Paid Leave + Weekly Off + Holiday
- Total LOP Days = Unauthorized Absent + LWP

**Step 4: Calculate Gross Earnings**

For each earning component:
- If LOP applicable: Earned Amount = (Monthly Amount / Payable Base) x Paid Days
- If LOP not applicable: Earned Amount = Monthly Amount (full)
- If mid-month joining: Pro-rata from DOJ to month end
- Add OT Pay, Variable inputs, Reimbursements
- Result: Gross Salary

**Step 5: Calculate Deductions**

- EPF (Employee): pf_rate x MIN(earned_pf_base, pf_ceiling)
- ESI (Employee): esi_ee_rate x earned_esi_base (if gross <= threshold)
- PT: Lookup(state, earned_pt_base, month)
- TDS: (Projected Annual Tax / Remaining Months) - Already Deducted
- Loan EMI: From loan module
- Other deductions: From variable inputs
- Result: Total Deductions

**Step 6: Calculate Net Pay**

Net Pay = Gross Salary - Total Deductions
Apply rounding per configuration (floor / ceil / nearest)
If negative net pay not allowed and net pay < 0: Flag for manual review

**Step 7: Calculate Employer Cost**

- EPF (Employer) = employer_pf_rate x pf_base
- EPS = 8.33% x MIN(pf_base, 15000)
- ESI (Employer) = esi_er_rate x esi_base
- Gratuity = gratuity_rate x basic
- PF Admin, EDLI, LWF (Employer) per configuration
- Total Employer Cost = Gross + All Employer Contributions
- CTC/Month = Total Employer Cost

**Step 8: Apply Final Validations**

- Net Pay >= 0
- Gross matches sum of components
- PF correctly calculated
- Minimum wages met
- Variance from last month within threshold
- All mandatory deductions applied
- Bank details present

---

## Section 10: Loan & Advance Module

### Execution Mode Configuration

| Config Key | Options |
|------------|---------|
| loan_types_available | Housing / Vehicle / Personal / Festival / Emergency / Salary |
| max_emi_percentage_of_gross | 30% / 40% / 50% |
| interest_rate | 0% / SBI rate / custom |
| max_tenure_months | Per type configuration |
| approval_hierarchy | HR to Finance to Director |
| auto_emi_deduction | yes / no |
| multiple_loans_allowed | yes / no |
| loan_foreclosure_allowed | yes / no |

### Loan Record

- Loan ID, Type, Sanction Amount, Sanction Date
- EMI Amount, Tenure, Start Date
- Interest Rate, Total Interest
- Outstanding Balance (auto-updated monthly)
- Status: Active / Closed / Foreclosed

### Compliance Mode Alerts

- Interest-free loan exceeding threshold: Perquisite tax alert
- Loan balance exceeding Full & Final amount on exit

---

## Section 11: Full & Final (F&F) Module

### Execution Mode Configuration

| Config Key | Options |
|------------|---------|
| ff_processing_deadline | 15 / 30 / 45 days from LWD |
| gratuity_auto_calculate | yes / no |
| gratuity_eligibility_years | 5 / custom |
| el_encash_on_exit | yes / no |
| notice_recovery_base | gross / basic / ctc |
| bonus_prorata_on_exit | yes / no |
| negative_ff_allowed | yes / no |

### F&F Auto-Calculation Flow

1. Last month salary (pro-rata)
2. + Leave encashment
3. + Gratuity (if eligible)
4. + Pending bonus/incentive
5. + Pending reimbursements
6. + Notice pay (if applicable)
7. - Notice recovery (if applicable)
8. - Loan outstanding
9. - Other recoveries
10. - TDS on F&F
11. = Net F&F Payable

### Compliance Mode Alerts

- F&F pending beyond deadline
- Gratuity not paid to eligible employee
- Leave balance not encashed on exit

---

## Section 12: Compliance Engine (Compliance Mode - Full Design)

The Compliance Engine runs parallel to the Execution Engine. It generates:

### Module A: Statutory Gap Report

Auto-generated every payroll cycle:

| Check | Status | Risk Level |
|-------|--------|------------|
| Minimum wages compliance | Compliant / Breach | High |
| PF on correct base | Compliant / Warning | Medium |
| ESI threshold correct | Compliant / Breach | High |
| PT correct state slab | Compliant / Warning | Low |
| OT rate meets statutory minimum | Compliant / Breach | High |
| OT hours within legal maximum | Compliant / Warning | Medium |
| Bonus paid to eligible employees | Compliant / Breach | High |
| Gratuity provision made | Compliant / Warning | Medium |
| Maternity benefit given | Compliant / Breach | High |
| Payment within due date | Compliant / Breach | High |

### Module B: Actual vs Statutory Comparison

Per employee, per month:

| Component | Company Paid | Statutory Due | Gap |
|-----------|-------------|---------------|-----|
| OT Pay | 2,400 | 3,000 | -600 |
| PF (Employer) | 1,800 | 1,800 | 0 |
| ESI (Employer) | 975 | 975 | 0 |
| Bonus | 0 | 833 | -833 |
| Minimum Wages | 10,000 | 12,000 | -2,000 |

Company-wide monthly risk summary aggregates total underpayment across all employees.

### Module C: Data Integrity Report

| Check | Count | Action |
|-------|-------|--------|
| Raw OT not equal to Paid OT | 45 | Review |
| Attendance manually edited | 12 | Verify |
| Config changed this month | 3 | Audit |
| Salary hold active | 2 | Follow-up |
| Negative net pay | 1 | Resolve |
| Employees without bank details | 3 | Update |

### Module D: Configuration Change Log

Every config change is permanently logged:

| Date | Changed By | Field | Old Value | New Value |
|------|-----------|-------|-----------|-----------|
| 15-Jan-25 | Admin_01 | ot_multiplier | 2x | 1.5x |
| 15-Jan-25 | Admin_01 | ot_rounding | nearest | floor |
| 20-Jan-25 | HR_01 | pf_ceiling | 15000 | 10000 |

### Module E: Rounding Impact Report

| Area | Raw Total | Rounded Total | Impact |
|------|-----------|---------------|--------|
| OT Hours | 1250.75 | 1230.00 | -4,150 |
| Net Salary | varies | varies | -890 |

### Module F: Filing & Deadline Tracker

| Filing | Due Date | Status | Penalty |
|--------|----------|--------|---------|
| PF Payment | 15-Feb-25 | Completed | - |
| ESI Payment | 15-Feb-25 | Pending | 50/day |
| TDS Deposit | 07-Feb-25 | Completed | - |
| Form 16 | 15-Jun-25 | Upcoming | 100/day |

---

## Section 13: Audit Trail Module

### What Is Logged

| Action Type | Details Captured |
|------------|------------------|
| Employee data change | field, old value, new value, user, timestamp |
| Salary structure change | component, old value, new value, user |
| Configuration change | key, old value, new value, user, timestamp |
| Attendance edit | employee, date, old value, new value, user |
| Leave approval/rejection | employee, type, status, approver |
| OT approval/edit | employee, hours, old value, new value |
| Payroll run | month, user, timestamp |
| Payroll reprocess | month, reason, user |
| User login/logout | user, time, IP address |
| Payslip viewed/downloaded | employee, user, timestamp |

### Rules

- Audit logs are immutable (cannot be deleted or edited)
- Retention: Minimum 7 years
- Accessible to: Super Admin and Auditor roles only
- Exportable to PDF/Excel for external audit

---

## Section 14: Outputs & Reports

### A. Payslip (Per Employee)

- All earning components with amounts
- All deduction components with amounts
- Gross, Total Deductions, Net Pay
- Employer contributions (optional display)
- Year-to-Date summary
- Leave balance
- Loan balance
- Net Pay in words
- Company logo and confidential watermark
- Format: PDF, password-protected
- Delivery: Email / Portal / Both

### B. Salary Register

- All employees in one sheet
- Component-wise breakup
- Filters: Department / Location / Grade / Pay Group
- Summary row at bottom
- Format: Excel and PDF

### C. Bank File

- Bank-specific format (NEFT / RTGS / NACH)
- Employee Name, Account No, IFSC, Amount
- Ready to upload to banking portal
- Control totals for reconciliation

### D. Statutory Reports

- PF ECR file (EPFO format)
- ESI contribution file
- PT challan data
- TDS challan data
- Form 24Q data
- Form 16 (Part A + Part B)
- Form 12BA
- LWF report
- Bonus report (Form C/D)
- Gratuity report (Form I/F)

### E. MIS Reports

- Headcount and cost summary
- Department-wise salary summary
- Month-on-month variance
- Year-to-Date cost analysis
- OT, Leave, LOP analysis
- Loan outstanding
- Full & Final pending
- Budget vs actual
- Attrition cost

### F. Compliance Reports (Compliance Mode)

- Statutory gap report
- Actual vs statutory comparison
- Rounding impact report
- Configuration change log
- Data integrity report
- Filing deadline tracker
- Audit trail report
