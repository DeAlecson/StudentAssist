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
    <div class="cs-sh">Liquidity Ratios</div>
    <div class="cs-formula">Current Ratio = Current Assets ÷ Current Liabilities <span class="cs-target">(target &gt; 1)</span></div>
    <div class="cs-formula">Quick Ratio = (Cash + Receivables) ÷ Current Liabilities</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Profitability Ratios</div>
    <div class="cs-formula">Gross Profit Margin = Gross Profit ÷ Revenue × 100%</div>
    <div class="cs-formula">Net Profit Margin = PAT ÷ Revenue × 100%</div>
    <div class="cs-formula">ROE = PAT ÷ Shareholders' Equity × 100%</div>
    <div class="cs-formula">ROA = PAT ÷ Total Assets × 100%</div>
    <div class="cs-formula">EPS = PAT ÷ No. of Ordinary Shares</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Efficiency (Activity) Ratios</div>
    <div class="cs-formula">Inventory Turnover = COGS ÷ Average Inventory <span class="cs-target">(times/yr)</span></div>
    <div class="cs-formula">Inventory Days = 365 ÷ Inventory Turnover</div>
    <div class="cs-formula">Receivables Days = 365 ÷ (Credit Sales ÷ Avg Receivables)</div>
    <div class="cs-formula">Payables Days = 365 ÷ (COGS ÷ Avg Payables)</div>
    <div class="cs-formula">Asset Turnover = Revenue ÷ Total Assets</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Leverage &amp; Market Ratios</div>
    <div class="cs-formula">Debt-to-Equity = Total Debt ÷ Shareholders' Equity</div>
    <div class="cs-formula">Gearing = IBL ÷ (IBL + Equity) × 100%</div>
    <div class="cs-formula">Interest Coverage = EBIT ÷ Interest Expense <span class="cs-target">(times)</span></div>
    <div class="cs-formula">P/E Ratio = Market Price per Share ÷ EPS</div>
    <div class="cs-formula">Dividend Yield = DPS ÷ Market Price × 100%</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">CVP Analysis</div>
    <div class="cs-formula">CM per unit = Selling Price − Variable Cost per unit</div>
    <div class="cs-formula">CM Ratio (CMR) = CM ÷ Selling Price</div>
    <div class="cs-formula">BEP (units) = Fixed Costs ÷ CM per unit</div>
    <div class="cs-formula">BEP ($) = Fixed Costs ÷ CM Ratio</div>
    <div class="cs-formula">Target Profit Units = (FC + Target Profit) ÷ CM</div>
    <div class="cs-formula">Margin of Safety = Actual Sales − BEP Sales</div>
    <div class="cs-formula">MOS % = MOS ÷ Actual Sales × 100%</div>
  </div>

</div>
<div class="cs-col">

  <div class="cs-section">
    <div class="cs-sh">Double Entry Rules (DEAD CLIC)</div>
    <table class="cs-table">
      <tr><th>Debit ↑</th><th>Credit ↑</th></tr>
      <tr><td><b>D</b>rawings</td><td><b>C</b>apital / Equity</td></tr>
      <tr><td><b>E</b>xpenses</td><td><b>L</b>iabilities</td></tr>
      <tr><td><b>A</b>ssets</td><td><b>I</b>ncome / Revenue</td></tr>
      <tr><td><b>D</b>ividends</td><td><b>C</b>ontra-assets (Acc. Dep.)</td></tr>
    </table>
    <div class="cs-note">Opposite applies for decreases. Every transaction: Debits = Credits</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Depreciation</div>
    <div class="cs-formula">Straight-Line: Dep = (Cost − Residual) ÷ Useful Life /yr</div>
    <div class="cs-formula">Reducing Balance: Dep = Carrying Value × Rate%</div>
    <div class="cs-formula">Carrying Value = Cost − Accumulated Depreciation</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Adjusting Entries (Period End)</div>
    <ul class="cs-list">
      <li><b>Accrued expense</b>: DR Expense / CR Accrued Liability</li>
      <li><b>Prepaid expense</b>: DR Prepaid (Asset) / CR Cash — then DR Expense / CR Prepaid each period</li>
      <li><b>Unearned revenue</b>: DR Cash / CR Unearned Revenue — then DR Unearned / CR Revenue as earned</li>
      <li><b>Accrued revenue</b>: DR Receivable / CR Revenue</li>
    </ul>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Cash Flow Statement</div>
    <table class="cs-table">
      <tr><th>Section</th><th>Includes</th></tr>
      <tr><td><b>Operating</b></td><td>Cash from/to customers, suppliers, employees, tax</td></tr>
      <tr><td><b>Investing</b></td><td>Buy/sell non-current assets, investments</td></tr>
      <tr><td><b>Financing</b></td><td>Share issues, loans, dividends paid, loan repayments</td></tr>
    </table>
    <div class="cs-note">Indirect method: Net Profit + non-cash items (dep.) ± working capital changes</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Flexible Budget &amp; Variances</div>
    <div class="cs-formula">Flexible Budget = Fixed Costs + (Actual Volume × Budgeted VC per unit)</div>
    <div class="cs-formula">Volume Variance = (Actual − Budgeted Volume) × Budgeted CM</div>
    <div class="cs-formula">Sales Price Variance = (Actual SP − Budgeted SP) × Actual Volume</div>
    <div class="cs-formula">Variable Cost Variance = (Budgeted VC − Actual VC) × Actual Volume</div>
    <div class="cs-note">Favourable (F): better than budget · Adverse (A): worse than budget</div>
  </div>

  <div class="cs-section">
    <div class="cs-sh">Financial Statements Structure</div>
    <ul class="cs-list">
      <li><b>Income Statement</b>: Revenue − COGS = GP − Expenses = EBIT − Interest = EBT − Tax = PAT</li>
      <li><b>Balance Sheet</b>: Assets = Liabilities + Equity</li>
      <li><b>Retained Earnings</b>: Opening RE + PAT − Dividends = Closing RE</li>
    </ul>
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
