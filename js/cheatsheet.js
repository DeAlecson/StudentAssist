const Cheatsheet = (() => {

  // ─── ICT162 cheatsheet ───────────────────────────────────────────────────
  const ICT162_HTML = `
<div class="cs-col">

  <div class="cs-section">
    <div class="cs-sh">Class Anatomy</div>
    <pre class="cs-pre">class Child(Parent):
    class_var = value          # shared across all instances

    def __init__(self, x, y):
        super().__init__(x)    # call parent constructor
        self._y = y            # protected by convention
        self.__z = 0           # name-mangled → _Child__z

    @property
    def y(self): return self._y

    @y.setter
    def y(self, v): self._y = v

    def __str__(self): return f"y={self._y}"</pre>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Overriding Types</div>
    <table class="cs-table">
      <tr><th>Type</th><th>Rule</th><th>super() used?</th></tr>
      <tr><td>Replacement</td><td>Completely new logic</td><td class="no">No</td></tr>
      <tr><td>Refinement</td><td>Extends parent logic</td><td class="yes">Yes</td></tr>
    </table>
    <div class="cs-note">MRO: Python searches most-derived class first (C → B → A)</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Relationships</div>
    <table class="cs-table">
      <tr><th>Pattern</th><th>Keyword</th><th>UML</th></tr>
      <tr><td><b>Inheritance</b> (IS-A)</td><td>class B(A)</td><td>Hollow ▷ arrow</td></tr>
      <tr><td><b>Composition</b> (HAS-A)</td><td>self._obj = A()</td><td>Solid ◆ line</td></tr>
    </table>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Abstract Classes</div>
    <pre class="cs-pre">from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: pass
    # Cannot instantiate → TypeError</pre>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Key OOP Terms</div>
    <ul class="cs-list">
      <li><b>Polymorphism</b> — same method call, different behaviour per runtime type</li>
      <li><b>Overloading (Python)</b> — simulate with default params: <code>def f(self, x=None)</code></li>
      <li><b>Encapsulation</b> — hide data via <code>_attr</code> (protected) or <code>__attr</code> (mangled)</li>
      <li><b>class_var</b> — shared; access via <code>ClassName.var</code> not <code>self.var</code></li>
    </ul>
  </div>

</div>
<div class="cs-col">

  <div class="cs-section">
    <div class="cs-sh">Exception Handling</div>
    <pre class="cs-pre">class MyError(Exception): pass   # custom exception

try:
    risky()
except SpecificError as e:
    handle(e)
except (TypeA, TypeB):
    ...
else:
    pass    # runs if NO exception raised
finally:
    pass    # ALWAYS runs
raise MyError("message")</pre>
    <ul class="cs-list">
      <li>Constructor should raise but NOT catch exceptions from called validators</li>
      <li>Validators return <code>True</code> on success, raise on failure</li>
    </ul>
  </div>

  <div class="cs-section">
    <div class="cs-sh">tkinter Quick Ref</div>
    <pre class="cs-pre">import tkinter as tk
from tkinter import messagebox
from tkinter.scrolledtext import ScrolledText

root = tk.Tk()
lbl  = tk.Label(root, text="Hi")
ent  = tk.Entry(root)
btn  = tk.Button(root, text="Go", command=cb)
txt  = ScrolledText(root, height=10)

# Grid layout (preferred for forms)
lbl.grid(row=0, column=0, sticky='e', padx=5, pady=5)
ent.grid(row=0, column=1, padx=5)
btn.grid(row=1, column=0, columnspan=2)

# Read / write
val = ent.get().strip()
lbl.config(text="new")
txt.insert('1.0', content)
txt.delete('1.0', tk.END)

# Dialogs
messagebox.showerror("Title", "msg")
messagebox.showinfo("Title",  "msg")

root.mainloop()</pre>
  </div>

  <div class="cs-section">
    <div class="cs-sh">UML Class Diagram</div>
    <table class="cs-table">
      <tr><th>Symbol</th><th>Meaning</th></tr>
      <tr><td>▷ hollow arrow</td><td>Inheritance / Generalisation</td></tr>
      <tr><td>◆ filled diamond</td><td>Composition (strong HAS-A)</td></tr>
      <tr><td>◇ hollow diamond</td><td>Aggregation (weak HAS-A)</td></tr>
      <tr><td><code>+</code> / <code>-</code> / <code>#</code></td><td>public / private / protected</td></tr>
      <tr><td><i>italics</i> / {abstract}</td><td>Abstract method/class</td></tr>
      <tr><td>class_var : type</td><td>Underlined = class variable</td></tr>
    </table>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Classmethods &amp; Staticmethods</div>
    <pre class="cs-pre">@classmethod
def from_str(cls, s):      # cls = the class itself
    return cls(parse(s))

@staticmethod
def validate(x): ...       # no self or cls</pre>
  </div>

</div>`;

  // ─── SST101 cheatsheet ───────────────────────────────────────────────────
  const SST101_HTML = `
<div class="cs-col">

  <div class="cs-section">
    <div class="cs-sh">EVM Formulas</div>
    <table class="cs-table">
      <tr><th>Metric</th><th>Formula</th><th>Healthy</th></tr>
      <tr><td>CV (Cost Variance)</td><td>EV − AC</td><td class="yes">+ve = under budget</td></tr>
      <tr><td>SV (Schedule Variance)</td><td>EV − PV</td><td class="yes">+ve = ahead of schedule</td></tr>
      <tr><td>CPI</td><td>EV ÷ AC</td><td class="yes">&gt; 1.0</td></tr>
      <tr><td>SPI</td><td>EV ÷ PV</td><td class="yes">&gt; 1.0</td></tr>
      <tr><td>EAC</td><td>BAC ÷ CPI</td><td>Forecast final cost</td></tr>
      <tr><td>ETC</td><td>EAC − AC</td><td>Cost left to spend</td></tr>
      <tr><td>VAC</td><td>BAC − EAC</td><td class="yes">+ve = final surplus</td></tr>
      <tr><td>TCPI</td><td>(BAC−EV) ÷ (BAC−AC)</td><td>Efficiency needed to hit BAC</td></tr>
    </table>
    <div class="cs-note">PV = Planned Value · EV = Earned Value · AC = Actual Cost · BAC = Budget at Completion</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">PERT Estimation</div>
    <div class="cs-formula">E = (O + 4M + P) ÷ 6</div>
    <div class="cs-formula">σ = (P − O) ÷ 6 &nbsp;|&nbsp; Variance = σ²</div>
    <div class="cs-note">O = Optimistic · M = Most Likely · P = Pessimistic</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Critical Path Method (CPM)</div>
    <table class="cs-table">
      <tr><th>Pass</th><th>ES</th><th>EF</th></tr>
      <tr><td>Forward</td><td>max(EF predecessors)</td><td>ES + Duration − 1</td></tr>
      <tr><th>Pass</th><th>LS</th><th>LF</th></tr>
      <tr><td>Backward</td><td>LF − Duration + 1</td><td>min(LS successors)</td></tr>
    </table>
    <div class="cs-formula">Float = LS − ES = LF − EF</div>
    <div class="cs-note">Critical path = all tasks with Float = 0 · Longest path through network</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Project Lifecycle</div>
    <div class="cs-chips">
      <span class="cs-chip">1 Initiating</span>
      <span class="cs-chip">2 Planning</span>
      <span class="cs-chip">3 Executing</span>
      <span class="cs-chip">4 Monitoring &amp; Controlling</span>
      <span class="cs-chip">5 Closing</span>
    </div>
    <ul class="cs-list">
      <li><b>Charter</b> — formally authorises the project</li>
      <li><b>WBS</b> — hierarchical decomposition of all deliverables</li>
      <li><b>Scope creep</b> — uncontrolled scope growth; managed via change control</li>
      <li><b>Baseline</b> — approved plan (scope + schedule + cost) used for comparison</li>
    </ul>
  </div>

</div>
<div class="cs-col">

  <div class="cs-section">
    <div class="cs-sh">Tuckman's 5-Stage Model</div>
    <table class="cs-table">
      <tr><th>#</th><th>Stage</th><th>Characteristics</th></tr>
      <tr><td>1</td><td><b>Forming</b></td><td>Polite, dependent on PM, unclear roles</td></tr>
      <tr><td>2</td><td><b>Storming</b></td><td>Conflicts, role competition, tension</td></tr>
      <tr><td>3</td><td><b>Norming</b></td><td>Cohesion, shared norms, trust builds</td></tr>
      <tr><td>4</td><td><b>Performing</b></td><td>High efficiency, self-directing team</td></tr>
      <tr><td>5</td><td><b>Adjourning</b></td><td>Project ends, team dissolves</td></tr>
    </table>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Estimation Methods</div>
    <table class="cs-table">
      <tr><th>Method</th><th>Approach</th><th>Accuracy</th></tr>
      <tr><td><b>Analogous</b></td><td>Compare past similar projects</td><td>Low–Med</td></tr>
      <tr><td><b>Parametric</b></td><td>Statistical model (cost/m², function points)</td><td>Med–High</td></tr>
      <tr><td><b>Bottom-Up</b></td><td>Detail each WBS work package; aggregate</td><td>Highest</td></tr>
      <tr><td><b>PERT (3-point)</b></td><td>O, M, P → weighted average</td><td>Med–High</td></tr>
    </table>
    <div class="cs-note">Cone of Uncertainty: estimates improve as project progresses</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Risk Management</div>
    <ul class="cs-list">
      <li><b>Avoid</b> — change plan to eliminate risk</li>
      <li><b>Mitigate</b> — reduce probability or impact</li>
      <li><b>Transfer</b> — shift to third party (insurance, contract)</li>
      <li><b>Accept</b> — acknowledge; set contingency reserve</li>
      <li><b>Contingency reserve</b> — for known risks (known-unknowns)</li>
      <li><b>Management reserve</b> — for unknown risks (unknown-unknowns)</li>
    </ul>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Agile / Scrum</div>
    <div class="cs-formula">Product Backlog → Sprint Backlog → Sprint (1–4 wks) → Review + Retro</div>
    <ul class="cs-list">
      <li><b>Daily Scrum</b> — 15-min standup: done / next / blockers</li>
      <li><b>Velocity</b> — story points completed per sprint</li>
      <li><b>Definition of Done</b> — agreed criteria for completing a user story</li>
      <li><b>Burndown chart</b> — remaining work vs. time in sprint</li>
    </ul>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Gantt &amp; Network Terms</div>
    <ul class="cs-list">
      <li><b>Gantt chart</b> — bar chart showing tasks, durations, dependencies over time</li>
      <li><b>Float/Slack</b> — time a task can delay without delaying the project</li>
      <li><b>Lag</b> — delay between predecessor finish and successor start</li>
      <li><b>Lead</b> — overlap allowed between predecessor and successor</li>
      <li><b>Fast-tracking</b> — overlap sequential tasks to compress schedule</li>
      <li><b>Crashing</b> — add resources to critical path to shorten duration</li>
    </ul>
  </div>

</div>`;

  // ─── ACC202 cheatsheet ───────────────────────────────────────────────────
  const ACC202_HTML = `
<div class="cs-col">

  <div class="cs-section">
    <div class="cs-sh">Account Types — ALREX + Dr/Cr Rules</div>
    <table class="cs-table">
      <tr><th>Type</th><th>Examples</th><th>Increase</th><th>Decrease</th><th>Statement</th></tr>
      <tr><td><b>A</b>sset</td><td>Cash, Receivables, Equipment, Prepaid</td><td class="yes">Dr ↑</td><td class="no">Cr ↓</td><td>SoFP</td></tr>
      <tr><td><b>L</b>iability</td><td>Payables, Loans, Unearned Revenue</td><td class="no">Cr ↑</td><td class="yes">Dr ↓</td><td>SoFP</td></tr>
      <tr><td><b>E</b>quity</td><td>Share Capital, Retained Earnings</td><td class="no">Cr ↑</td><td class="yes">Dr ↓</td><td>SoFP</td></tr>
      <tr><td><b>R</b>evenue</td><td>Sales, Service Revenue</td><td class="no">Cr ↑</td><td class="yes">Dr ↓</td><td>IS</td></tr>
      <tr><td><b>X</b>pense</td><td>Salary, Rent, Depreciation Exp.</td><td class="yes">Dr ↑</td><td class="no">Cr ↓</td><td>IS</td></tr>
    </table>
    <div class="cs-note">Stock accounts (A, L, E) = Balance Sheet · Flow accounts (R, X) = Income Statement · Flow accounts reset to $0 each period</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Accounting Equation &amp; Equity</div>
    <div class="cs-formula">Assets = Liabilities + Equity</div>
    <div class="cs-formula">Equity = Share Capital + Retained Earnings + Revenue − Expenses</div>
    <div class="cs-formula">Closing Equity = Opening Equity + Net Profit − Dividends</div>
    <div class="cs-note">Revenue ↑ Equity · Expenses ↓ Equity · Every transaction must keep equation balanced</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Adjusting Entries — 4 Types</div>
    <table class="cs-table">
      <tr><th>Type</th><th>When cash is paid/received</th><th>Adjusting Entry (period end)</th></tr>
      <tr><td><b>Prepaid Expense</b></td><td>Cash paid BEFORE expense used<br><i>Dr Prepaid / Cr Cash</i></td><td>Dr Expense / Cr Prepaid<br><i>(portion used this period)</i></td></tr>
      <tr><td><b>Accrued Expense</b></td><td>Cash paid AFTER expense incurred</td><td>Dr Expense / Cr Accrued Liability<br><i>(owe but haven't paid)</i></td></tr>
      <tr><td><b>Unearned Revenue</b></td><td>Cash received BEFORE service done<br><i>Dr Cash / Cr Unearned Rev.</i></td><td>Dr Unearned Revenue / Cr Revenue<br><i>(portion earned this period)</i></td></tr>
      <tr><td><b>Accrued Revenue</b></td><td>Cash received AFTER service done</td><td>Dr Accounts Receivable / Cr Revenue<br><i>(earned but not yet billed)</i></td></tr>
    </table>
    <div class="cs-note">Prepaid formula: Monthly = Total ÷ Months · Remaining Prepaid = Total − Amount Used</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Depreciation</div>
    <div class="cs-formula">Straight-Line: Dep/yr = (Cost − Residual Value) ÷ Useful Life</div>
    <div class="cs-formula">Reducing Balance: Dep/yr = Carrying Value × Rate%</div>
    <div class="cs-formula">Carrying Value = Cost − Accumulated Depreciation</div>
    <div class="cs-note">Journal: Dr Depreciation Expense / Cr Accumulated Depreciation (contra-asset)</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">CVP Analysis</div>
    <div class="cs-formula">CM per unit = Selling Price − Variable Cost per unit</div>
    <div class="cs-formula">CM Ratio = CM per unit ÷ Selling Price</div>
    <div class="cs-formula">BEP (units) = Fixed Costs ÷ CM per unit</div>
    <div class="cs-formula">BEP ($) = Fixed Costs ÷ CM Ratio</div>
    <div class="cs-formula">Target units (pre-tax) = (FC + Target Profit) ÷ CM</div>
    <div class="cs-formula" style="background:rgba(245,158,11,0.12)">⭐ After-tax target → Pre-tax: Pre-tax Profit = After-tax ÷ (1 − Tax Rate)</div>
    <div class="cs-formula">Margin of Safety (units) = Actual Sales − BEP · MOS% = MOS ÷ Actual × 100%</div>
    <div class="cs-formula">Degree of Operating Leverage (DOL) = CM ÷ Operating Income</div>
    <div class="cs-note">DOL × % change in sales = % change in profit · High DOL = high fixed costs = amplified swings</div>
  </div>

</div>
<div class="cs-col">

  <div class="cs-section">
    <div class="cs-sh">⭐ Static vs Flexible Budget Template</div>
    <table class="cs-table">
      <tr><th></th><th>Static Budget</th><th>Flexible Budget</th><th>Actual</th></tr>
      <tr><td><b>Units</b></td><td>Budgeted qty</td><td><b>Actual qty</b></td><td>Actual qty</td></tr>
      <tr><td><b>Revenue</b></td><td>BQ × Budget SP</td><td>AQ × Budget SP</td><td>AQ × Actual SP</td></tr>
      <tr><td><b>Variable Costs</b></td><td>BQ × Budget VC</td><td>AQ × Budget VC</td><td>AQ × Actual VC</td></tr>
      <tr><td><b>Fixed Costs</b></td><td>Budget FC</td><td>Budget FC</td><td>Actual FC</td></tr>
      <tr><td><b>Operating Profit</b></td><td><b>$A</b></td><td><b>$B</b></td><td><b>$C</b></td></tr>
    </table>
    <div class="cs-formula">Sales Volume Variance (SVV) = $B − $A &nbsp;→&nbsp; F if B &gt; A (sold more than planned)</div>
    <div class="cs-formula">Flexible Budget Variance (FBV) = $C − $B &nbsp;→&nbsp; F if C &gt; B (better prices/costs)</div>
    <div class="cs-formula">Total Variance = $C − $A = SVV + FBV &nbsp;✓ (always verify)</div>
    <div class="cs-note">F = Favourable (actual better than budget) · U = Unfavourable (actual worse)</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Financial Statements — Structure</div>
    <table class="cs-table">
      <tr><th>Statement</th><th>What it shows</th><th>Period or Date?</th></tr>
      <tr><td><b>Income Statement</b></td><td>Revenue − COGS = GP − Expenses = EBIT − Interest = EBT − Tax = PAT</td><td>Period (flow)</td></tr>
      <tr><td><b>Statement of Financial Position</b> (Balance Sheet)</td><td>Assets = Liabilities + Equity</td><td>At a date (stock)</td></tr>
      <tr><td><b>Statement of Changes in Equity</b></td><td>Opening Equity + Net Profit − Dividends = Closing Equity</td><td>Period (flow)</td></tr>
      <tr><td><b>Statement of Cash Flows</b></td><td>Operating + Investing + Financing = Net Cash Change</td><td>Period (flow)</td></tr>
    </table>
    <table class="cs-table" style="margin-top:6px">
      <tr><th>Cash Flow Section</th><th>Key Items</th></tr>
      <tr><td><b>Operating</b></td><td>Collections, payments to suppliers/employees, tax paid</td></tr>
      <tr><td><b>Investing</b></td><td>Buy/sell property, equipment, long-term investments</td></tr>
      <tr><td><b>Financing</b></td><td>Issuing shares, borrowing, repaying loans, paying dividends</td></tr>
    </table>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Financial Ratios</div>
    <table class="cs-table">
      <tr><th>Ratio</th><th>Formula</th></tr>
      <tr><td colspan="2" style="background:rgba(245,158,11,0.08);font-weight:600">Liquidity</td></tr>
      <tr><td>Current Ratio</td><td>Current Assets ÷ Current Liabilities <i>(healthy &gt;1)</i></td></tr>
      <tr><td>Acid-Test (Quick)</td><td>(Current Assets − Inventory) ÷ Current Liabilities</td></tr>
      <tr><td colspan="2" style="background:rgba(245,158,11,0.08);font-weight:600">Profitability</td></tr>
      <tr><td>Gross Profit Margin</td><td>Gross Profit ÷ Revenue × 100%</td></tr>
      <tr><td>Net Profit Margin</td><td>PAT ÷ Revenue × 100%</td></tr>
      <tr><td>ROE</td><td>PAT ÷ Avg Shareholders' Equity × 100%</td></tr>
      <tr><td>ROA</td><td>PAT ÷ Avg Total Assets × 100%</td></tr>
      <tr><td colspan="2" style="background:rgba(245,158,11,0.08);font-weight:600">Efficiency</td></tr>
      <tr><td>Inventory Turnover</td><td>COGS ÷ Avg Inventory <i>(times/yr)</i></td></tr>
      <tr><td>Inventory Days</td><td>365 ÷ Inventory Turnover</td></tr>
      <tr><td>Receivables Days</td><td>Avg Receivables ÷ (Credit Sales ÷ 365)</td></tr>
      <tr><td>Payables Days</td><td>Avg Payables ÷ (COGS ÷ 365)</td></tr>
      <tr><td colspan="2" style="background:rgba(245,158,11,0.08);font-weight:600">Leverage &amp; Market</td></tr>
      <tr><td>Gearing</td><td>IBL ÷ (IBL + Equity) × 100%</td></tr>
      <tr><td>Interest Coverage</td><td>EBIT ÷ Interest Expense <i>(times)</i></td></tr>
      <tr><td>EPS</td><td>PAT ÷ No. of Ordinary Shares</td></tr>
      <tr><td>P/E Ratio</td><td>Market Price per Share ÷ EPS</td></tr>
    </table>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Budgeting Quick Reference</div>
    <table class="cs-table">
      <tr><th>Approach</th><th>Key Feature</th><th>Strength / Weakness</th></tr>
      <tr><td><b>Incremental</b></td><td>Prior year + adjustments</td><td>Fast; may entrench inefficiencies</td></tr>
      <tr><td><b>Zero-Based (ZBB)</b></td><td>Every item justified from $0</td><td>Eliminates waste; very time-consuming</td></tr>
      <tr><td><b>Rolling</b></td><td>Always adds next period as one expires</td><td>Current; never "stale"</td></tr>
      <tr><td><b>Top-Down</b></td><td>Senior management sets targets</td><td>Fast alignment; low buy-in</td></tr>
      <tr><td><b>Participative</b></td><td>Managers provide input</td><td>Accurate; risk of padding/slack</td></tr>
    </table>
    <div class="cs-note">Master budget sequence: Sales → Production → Materials → Labour → Overhead → Cash → Budgeted IS → Budgeted SoFP</div>
  </div>

</div>`;

  // ─── MKT202 cheatsheet ───────────────────────────────────────────────────
  const MKT202_HTML = `
<div class="cs-col">

  <div class="cs-section">
    <div class="cs-sh">PESTLE Macroenvironment</div>
    <ul class="cs-list">
      <li><b>P</b>olitical — trade policy, taxes, stability, regulation</li>
      <li><b>E</b>conomic — GDP, inflation, interest rates, consumer spending</li>
      <li><b>S</b>ociocultural — demographics, lifestyle, values, Gen Z/millennial trends</li>
      <li><b>T</b>echnological — AI, 3D printing, e-commerce, digital platforms</li>
      <li><b>L</b>egal — consumer protection, IP, employment law, data privacy</li>
      <li><b>E</b>cological — climate change, sustainability, plastic regulation, ESG</li>
    </ul>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Marketing Mix (4Ps + 3Ps)</div>
    <table class="cs-table">
      <tr><th>P</th><th>Key Decisions</th></tr>
      <tr><td><b>Product</b></td><td>Core/Actual/Augmented levels · PLC · Branding · Differentiation</td></tr>
      <tr><td><b>Price</b></td><td>Objective · Method (cost/value/competition) · Strategy (skimming/penetration)</td></tr>
      <tr><td><b>Place</b></td><td>Channels · Intensity (intensive/selective/exclusive) · Logistics</td></tr>
      <tr><td><b>Promotion</b></td><td>IMC: Advertising · PR · Personal selling · Sales promo · Direct marketing</td></tr>
      <tr><td colspan="2"><i>Services add: People · Process · Physical Evidence</i></td></tr>
    </table>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Segmentation Bases</div>
    <table class="cs-table">
      <tr><th>Base</th><th>Variables</th></tr>
      <tr><td><b>Demographic</b></td><td>Age, gender, income, education, family lifecycle, occupation</td></tr>
      <tr><td><b>Geographic</b></td><td>Country, region, climate, urban/suburban/rural</td></tr>
      <tr><td><b>Psychographic</b></td><td>Personality, values, lifestyle, activities, interests, opinions (AIO)</td></tr>
      <tr><td><b>Behavioural</b></td><td>Purchase occasion, benefits sought, usage rate, loyalty, readiness</td></tr>
    </table>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Targeting Strategies</div>
    <ul class="cs-list">
      <li><b>Undifferentiated</b> — one offer to all (mass market)</li>
      <li><b>Differentiated</b> — separate offer per segment</li>
      <li><b>Concentrated (Niche)</b> — one segment only; maximise fit</li>
      <li><b>Micromarketing</b> — local or individual level</li>
    </ul>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Positioning</div>
    <ul class="cs-list">
      <li><b>POP</b> (Point-of-Parity) — shared with competitors; must-have to be considered</li>
      <li><b>POD</b> (Point-of-Difference) — unique to your brand; reason to choose you</li>
    </ul>
    <div class="cs-formula">"For [target], [brand] is the [category] that [POD] because [RTB]."</div>
    <div class="cs-note">Frame of Reference = the competitive category your brand competes in</div>
  </div>

</div>
<div class="cs-col">

  <div class="cs-section">
    <div class="cs-sh">Pricing Objectives &amp; Methods</div>
    <ul class="cs-list">
      <li><b>Objectives</b>: Survival · Max current profit · Max market share · Skimming · Quality leadership</li>
      <li><b>Markup</b>: Price = Cost ÷ (1 − margin)</li>
      <li><b>Target-Return</b>: Price = Cost + (ROI × Investment) ÷ Sales</li>
      <li><b>EVC</b>: Price = Reference Price + Differentiation Value (max rational price)</li>
      <li><b>Going-rate</b>: Price based on competitor prices (oligopoly markets)</li>
    </ul>
    <table class="cs-table">
      <tr><th>Strategy</th><th>Use When</th></tr>
      <tr><td><b>Skimming</b></td><td>Price-inelastic demand, premium signal, unique product</td></tr>
      <tr><td><b>Penetration</b></td><td>Price-sensitive market, build volume fast, deter competition</td></tr>
      <tr><td><b>Captive</b></td><td>Core cheap + consumables expensive (razors/blades, printers/ink)</td></tr>
      <tr><td><b>Discriminatory</b></td><td>Different prices: customer segment, time, location, product-form</td></tr>
    </table>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Communication (IMC) Tools</div>
    <table class="cs-table">
      <tr><th>Tool</th><th>Best For</th></tr>
      <tr><td><b>Social Media</b></td><td>Awareness, engagement, UGC, influencer (B2C emotional)</td></tr>
      <tr><td><b>Online / Content</b></td><td>SEO, email nurture, thought leadership, long-term traffic</td></tr>
      <tr><td><b>Mobile</b></td><td>SMS, push notifications, location-based, app marketing</td></tr>
      <tr><td><b>WOM / Referral</b></td><td>Trust-building, low cost, peer advocacy, new category trial</td></tr>
      <tr><td><b>PR</b></td><td>Credible third-party coverage; crisis management; events</td></tr>
    </table>
    <div class="cs-note">Message appeals: Rational · Emotional · Moral · Fear</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">AIDA Model</div>
    <div class="cs-chips">
      <span class="cs-chip">A Attention</span>
      <span class="cs-chip">I Interest</span>
      <span class="cs-chip">D Desire</span>
      <span class="cs-chip">A Action</span>
    </div>
    <div class="cs-note">Tools per stage — Awareness: ads/PR · Interest/Desire: content/influencers · Action: promos/selling</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Distribution Intensity</div>
    <ul class="cs-list">
      <li><b>Intensive</b> — max outlets; FMCG (coke, bread)</li>
      <li><b>Selective</b> — chosen outlets; image-conscious brands</li>
      <li><b>Exclusive</b> — one outlet per region; luxury goods</li>
    </ul>
    <div class="cs-note">Push strategy: trade promotions push product through channel · Pull: consumer demand pulls product through</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Market Entry &amp; Product Life Cycle</div>
    <ul class="cs-list">
      <li><b>Waterfall</b> — sequential market entry, one at a time (lower risk)</li>
      <li><b>Sprinkler</b> — simultaneous multi-market entry (first-mover advantage)</li>
      <li><b>Entry modes</b>: Indirect export → Direct export → Licensing → JV → Owned subsidiary</li>
    </ul>
    <table class="cs-table">
      <tr><th>PLC Stage</th><th>Marketing Focus</th></tr>
      <tr><td>Introduction</td><td>Awareness; informative advertising; high price (skimming) or low (penetration)</td></tr>
      <tr><td>Growth</td><td>Build preference; expand distribution; persuasive advertising</td></tr>
      <tr><td>Maturity</td><td>Defend share; price promotions; reminder advertising; new segments</td></tr>
      <tr><td>Decline</td><td>Harvest or divest; reduce costs; niche focus</td></tr>
    </table>
  </div>

</div>`;

  // ─── Sheet registry ───────────────────────────────────────────────────────
  const SHEETS = {
    ict162: { label: 'ICT162 — Python OOP',              color: '#00d4ff', html: ICT162_HTML },
    sst101: { label: 'SST101 — Project Management',      color: '#10b981', html: SST101_HTML },
    acc202: { label: 'ACC202 — Accounting',              color: '#f59e0b', html: ACC202_HTML },
    mkt202: { label: 'MKT202 — Marketing Management',   color: '#f472b6', html: MKT202_HTML }
  };

  // ─── State & helpers ──────────────────────────────────────────────────────
  let _moduleId = null;

  const _fab     = () => document.getElementById('cs-fab');
  const _overlay = () => document.getElementById('cs-overlay');

  // ─── Public API ───────────────────────────────────────────────────────────
  const show = (moduleId) => {
    _moduleId = moduleId;
    const fab = _fab();
    if (fab) fab.hidden = !SHEETS[moduleId]; // only show if sheet exists
  };

  const hide = () => {
    _moduleId = null;
    const fab = _fab();
    if (fab) fab.hidden = true;
    close();
  };

  const open = () => {
    if (!_moduleId || !SHEETS[_moduleId]) return;
    const sheet = SHEETS[_moduleId];
    const overlay = _overlay();
    if (!overlay) return;

    overlay.querySelector('.cs-module-label').textContent = sheet.label;
    overlay.querySelector('.cs-cols').innerHTML = sheet.html;
    overlay.style.setProperty('--cs-color', sheet.color);
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.cs-panel').scrollTop = 0;
  };

  const close = () => {
    const overlay = _overlay();
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = '';
  };

  const init = () => {
    const fab     = _fab();
    const overlay = _overlay();
    if (!fab || !overlay) return;

    fab.addEventListener('click', open);

    overlay.querySelector('#cs-close-btn')?.addEventListener('click', close);

    // Close on backdrop click
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Close on Escape
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  };

  return { init, show, hide, open, close };
})();
