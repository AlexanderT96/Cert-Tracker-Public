// Cert Tracker — post-catalogue policy/currentness normalization (September 2026).
// Keeps sparse secondary-filter records aligned with the dual-pillar policy and applies
// verified vendor-program corrections without changing stable internal certification IDs.
(function normalizeCataloguePolicy(){
  'use strict';
  if(typeof CERTS==='undefined'||!Array.isArray(CERTS))throw new Error('catalogue must load before catalogue-policy-normalize.js');
  const VERIFIED='2026-09-02';
  const byId=Object.fromEntries(CERTS.map(cert=>[cert.id,cert]));
  const patch=(id,values)=>{if(byId[id])Object.assign(byId[id],values);};

  // Review only the fields supported by the CompTIA-authored XK0-006 objectives.
  // A retrieved blueprint does not verify today's price, availability or renewal rules.
  const linuxObjectives='https://www.comptia.org/en-us/certifications/linux/';
  patch('linux-plus',{
    cost:'Planning estimate ~£277; current regional checkout price unverified',
    examFormat:'XK0-006: up to 90 multiple-choice and performance-based questions, 90 minutes. Confirm current booking conditions with CompTIA.',
    coverage:'System management (23%); services and user management (20%); security (18%); automation, orchestration and scripting (17%); troubleshooting (22%).',
    prerequisites:'CompTIA recommends 12 months of hands-on Linux server experience, with A+, Network+, Server+ or equivalent knowledge. Tracker dependencies are learning-order guidance, not proof of exam eligibility.',
    projectRec:'Supporting practice, not an extra credential: administer a Linux VM; diagnose networking and service failures; manage permissions, packages and storage; automate a repeatable task with Bash or Python.',
    note:'Linux administration supports networking, Azure Linux workloads and operational automation. In the focused route it comes before AZ-802 and AZ-104. Linux+ is a foundation, not proof of senior Linux engineering readiness. No additional certification or automatic cross-renewal is assumed; check current issuer renewal rules before relying on them. Study hours and price are planning estimates.',
    factChecks:{identity:{source:linuxObjectives,checkedAt:'2026-09-03'},blueprint:{source:linuxObjectives,checkedAt:'2026-09-03'}}
  });

  // Remove remaining knowledge-first / market-secondary copy inherited by sparse records.
  for(const cert of CERTS){
    if(typeof cert.note==='string'){
      cert.note=cert.note
        .replace(/market value is secondary\.?/ig,'market access and job-performance capability should be judged together.')
        .replace(/market value is a secondary signal\.?/ig,'market access is a co-equal signal alongside job-performance capability.')
        .replace(/knowledge value comes first\.?/ig,'market access and job-performance capability are co-equal.');
    }
  }

  // Palo Alto Networks' current role-based portfolio. These patches use the current
  // public certification names while retaining stable tracker IDs for saved-state safety.
  patch('pan-apprentice',{name:'Palo Alto Networks Certified Cybersecurity Apprentice',code:'CYBERSECURITY APPRENTICE',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/certification'});
  patch('pan-practitioner',{name:'Palo Alto Networks Certified Cybersecurity Practitioner',code:'CYBERSECURITY PRACTITIONER',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/certification'});
  patch('pan-netsec-pro',{name:'Palo Alto Networks Certified Network Security Professional',code:'NETWORK SECURITY PROFESSIONAL',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-netsec-professional',coverage:'Understand the Palo Alto Networks network-security portfolio and perform entry-level maintenance, configuration, installation and deployment across the platform.',projectRec:'Deploy a representative PAN-OS network-security lab, document baseline configuration and policy, then troubleshoot a deliberately broken connectivity or policy scenario.'});
  patch('pan-ngfw-eng',{name:'Palo Alto Networks Certified Next-Generation Firewall Engineer',code:'NGFW ENGINEER',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-ngfw-engineer',coverage:'Deploy, operate and administer Palo Alto Networks NGFW products, including PAN-OS networking, device settings, integrations, objects, policies and operational management.',projectRec:'Build and troubleshoot an NGFW lab covering interfaces/routing, zones, objects, security/NAT policy, logging, management and one automation/integration task.'});
  patch('pan-sse-eng',{name:'Palo Alto Networks Certified Security Service Edge Engineer',code:'SSE ENGINEER',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-sse-engineer',coverage:'Plan, deploy, configure, manage and troubleshoot Palo Alto Networks security service edge environments, including Prisma Access operational and architecture concepts.',projectRec:'Design a representative SSE/SASE deployment covering user/site connectivity, policy, identity, traffic flow, operational monitoring and a documented troubleshooting scenario.'});
  patch('pan-netsec-arch',{name:'Palo Alto Networks Certified Network Security Architect',code:'NETWORK SECURITY ARCHITECT',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-netsec-architect',coverage:'Translate technical and business requirements into secure, highly available and scalable network-security architectures using the Palo Alto Networks portfolio and relevant third-party integrations.',prerequisites:'Advanced architect-level target. Palo Alto Networks describes the intended audience as experienced network-security architects with 5+ years architecting Zero Trust across the Network Security platform and 2+ years of Palo Alto Networks hands-on experience. Treat these as readiness guidance even where the exam registration flow does not enforce them as formal prerequisites.',projectRec:'Produce and defend a complete network-security architecture package: requirements, Zero Trust design, HA/scalability, central management/IAM, branch/SASE, cloud/IoT/data-security integration, migration, failure domains and operational acceptance criteria.',note:'Architect-level capstone. Do not use the badge to simulate seniority: prioritise it when substantial architecture and Palo Alto hands-on evidence already exists.'});
  patch('pan-secops-arch',{name:'Palo Alto Networks Certified Security Operations Architect',code:'SECURITY OPERATIONS ARCHITECT',vendor:'Palo Alto Networks',verifiedAt:VERIFIED,sourceUrl:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-secops-architect',prerequisites:'Advanced architect-level target. Palo Alto Networks describes the intended audience as security-operations architects with 5+ years designing security operations, incident response and threat detection/prevention solutions plus 2+ years of Palo Alto Networks hands-on experience.',projectRec:'Design and defend a security-operations architecture covering telemetry, detection, investigation, automation/orchestration, incident response, integrations, resilience and measurable operational outcomes.',note:'Architect-level security-operations capstone; experience and design ownership should lead the timing, not exam availability.'});
  // Field-scoped issuer checks: do not refresh untouched facts or prices.
  const fact=(source)=>({source,checkedAt:'2026-09-02'});
  const py='https://pythoninstitute.org/pcpp2';
  patch('pcpp2',{validity:60,formalPrerequisites:[],prerequisites:'No formal prerequisites. PCAP and PCPP1 are recommended background. In development: not confirmed bookable.',factChecks:{identity:fact(py),availability:fact(py),eligibility:fact(py),renewal:fact(py)}});
  const cks='https://www.cncf.io/blog/2026/06/17/expanding-care-passing-cks-can-now-extend-your-cka-certification/';
  patch('cks',{formalPrerequisites:['cka'],prerequisites:'Previously passing CKA is required; it need not still be active. CKS earned on or after 18 June 2026 extends or reinstates previously earned CKA. Practical Kubernetes administration remains essential.',studyMaterials:'Use the current CNCF/LF CKS curriculum and practical labs. Check the official checkout for current regional pricing and included practice access.',factChecks:{eligibility:fact(cks),renewal:fact(cks)}});
  patch('htb-cjca',{name:'HTB Certified Junior Cybersecurity Associate',factChecks:{identity:fact('https://academy.hackthebox.com/preview/certifications/htb-certified-junior-cybersecurity-associate')}});
  patch('cissp',{requiresAwardConfirmation:true,prerequisites:'Full CISSP certification requires qualifying experience and endorsement, not only an exam pass. Candidates without the experience may pursue Associate of ISC2 status. Do not describe this as CISSP Associate.',factChecks:{eligibility:fact('https://www.isc2.org/certifications/associate')}});
  for(const id of ['ccsp','issap','issep','issmp','cisa','cism','crisc','cgeit'])patch(id,{requiresAwardConfirmation:true});
  for(const id of ['jsnad','jsnsd'])patch(id,{factChecks:{availability:fact('https://training.linuxfoundation.org/'+id+'-cert-inactive/')}});
  for(const id of ['fcx','fcss-secops','fortinet-ot-security'])patch(id,{requiresExternalPrerequisites:true});
  // Field-scoped reference review, 3 September 2026. Stable IDs preserve saved state.
  const reviewed='2026-09-03';
  const checked=(url,fields)=>Object.fromEntries(fields.map(field=>[field,{source:url,checkedAt:reviewed}]));
  const revise=(id,values,url,fields=[])=>{
    const c=byId[id];if(!c)return;
    Object.assign(c,values,{factChecks:{...c.factChecks,...checked(url,fields)},referenceReviewedAt:reviewed});
  };
  for(const [id,code,months,usd,questions,minutes] of [['pcep','PCEP-30-02',60,69,30,40],['pcap','PCAP-31-03',60,295,40,65],['pcpp1','PCPP-32-101',0,325,45,65]]){
    revise(id,{code,validity:months,cost:`From US$${usd}; UK tax/checkout total unverified`,costNum:0,
      examFormat:`${questions} questions; ${minutes} minutes excluding tutorial; 70% pass mark. Check the issuer's delivery policy.`,
      prerequisites:id==='pcep'?'No prerequisites.':'No formal prerequisites; earlier Python knowledge is recommended.',
      note:id==='pcpp1'?'Current PCPP-32-101 is lifetime; PCPP-32-102 is in development with five-year validity. Verify the version before booking. The credential assesses advanced Python knowledge; it does not by itself establish production engineering competence.':'Current issuer policy lists five-year validity. The next exam version is in development; no speculative retirement deadline is assumed. This is a locked learning milestone, supported by coding practice rather than badge collection.',
      studyMaterials:`Start with the official ${id.toUpperCase()} syllabus and linked Edube courses. Supplement with practical Python exercises; check third-party materials against the active exam code.`
    },`https://pythoninstitute.org/${id}`,['identity','availability','eligibility','renewal','price']);
  }
  const msBase='https://learn.microsoft.com/en-us/credentials/certifications/';
  const msRenew=msBase+'renew-your-microsoft-certification';
  const microsoft={
    'az-900':['azure-fundamentals/',45,'Cloud concepts, Azure architecture and services, management and governance.','Foundational Azure knowledge. No guaranteed event voucher or percentage of overlap with AZ-104 is assumed.'],
    'az-104':['azure-administrator/',100,'Azure identities and governance, storage, compute, networking and monitoring.','Build practical Azure administration, PowerShell/CLI, ARM or Bicep and Entra ID experience. Practice assessment scores are guidance, not a pass guarantee.'],
    'az-700':['azure-network-engineer-associate/',100,'Azure networking design, connectivity, routing, application delivery and network security.','Study after Azure administration and networking foundations. AZ-104 is learning-order guidance, not a claimed formal prerequisite.'],
    'sc-300':['identity-and-access-administrator/',100,'Microsoft Entra identity, authentication, workload identities and identity governance.','Build practical identity administration skills. Prior support experience does not establish a fixed percentage of exam readiness.'],
    'az-802':['windows-server-administrator-associate/',120,'Windows Server identity, hybrid administration, virtual machines, networking, storage, security and troubleshooting.','AZ-802 is the single-exam path. AZ-800 and AZ-801 retire on 30 September 2026. Confirm the current booking and practice-assessment availability.'],
    'sc-500':['cloud-and-ai-security-engineer-associate/',120,'Security for Azure and hybrid identities, networking, compute, data and AI workloads.','Practical Azure/hybrid administration and Entra ID familiarity matter. No SecAI+ or SC-200 exam is added as a requirement. Do not assume an old AZ-500 course covers the full current blueprint.'],
    'ai-901':['azure-ai-fundamentals/',null,'AI concepts and capabilities, and implementing AI solutions with Microsoft Foundry.','AI-901 expects Python syntax/programming knowledge and Azure familiarity. Use AI-901 materials; AI-900 resources are supplementary, not equivalent coverage.'],
    'ai-103':['azure-ai-apps-and-agents-developer-associate/',120,'Developing and operating apps and agents using Python, Azure AI and Microsoft Foundry.','Practical Python application development and Azure/AI familiarity are expected. No separate data-science certification is assumed.'],
    'az-305':['azure-solutions-architect/',null,'Designing Azure identity, governance, monitoring, storage, continuity and infrastructure solutions.','The Azure Solutions Architect Expert award requires Azure Administrator Associate plus AZ-305. Passing AZ-305 alone is not the full award.']
  };
  for(const [id,[slug,minutes,coverage,note]] of Object.entries(microsoft)){
    const url=msBase+slug,fundamental=['az-900','ai-901'].includes(id);
    revise(id,{code:id.toUpperCase(),coverage,note,prerequisites:id==='az-305'?'Azure Administrator Associate is required for the Expert certification award; distinguish this from exam scheduling.':note,
      ...id==='ai-901'?{deps:['pcep']}:id==='ai-103'?{deps:['pcap','ai-901']}:{},
      examFormat:minutes?`Proctored assessment: ${minutes} minutes, with possible interactive components. Refer to the current issuer page for exam policies.`:'Refer to the current Microsoft exam page for duration, delivery and assessment policies.',
      cost:'Regional Microsoft checkout price; confirm currency and taxes before booking',costNum:0,validity:fundamental?0:12,
      studyMaterials:'Use the current certification page and its linked study guide, learning modules and practice assessment where available. Availability of third-party courses is not assumed.'
    },url,['identity','blueprint']);
    Object.assign(byId[id].factChecks,checked(msRenew,['renewal']));
  }
  revise('az-305',{},msBase+'azure-solutions-architect/',['eligibility']);
  const cisco='https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/';
  revise('ccna',{cost:'US$400 listed by Cisco; confirm regional checkout and taxes',costNum:0,validity:36,
    examFormat:'200-301 CCNA; 120 minutes. Do not assume a fixed question count or unpublished pass score.',
    prerequisites:'No formal prerequisites. Practical networking and Cisco configuration skills support preparation.',
    note:'Core networking milestone in the locked route, not an elective. Use the current Cisco exam topics when selecting training. Old salary snapshots, first-attempt pass-rate claims and speculative transition deadlines have been removed.'
  },cisco+'ccna/index.html',['identity','availability','eligibility','blueprint','renewal','price']);
  revise('ccnp-enterprise',{note:'Complete ENCOR and the selected ENARSI concentration. The two exams constitute one CCNP milestone, not one exam. Confirm current exam topics and prices before booking.'},cisco+'ccnp-enterprise/index.html',['identity','eligibility','blueprint','renewal']);
  revise('ccie-enterprise',{cost:'US$400 qualifying exam + US$1,600 lab listed; taxes, retakes and travel extra',costNum:0,examFormat:'350-401 ENCOR qualifying exam and an eight-hour Enterprise Infrastructure lab.',note:'Locked expert capstone, reached through substantial practical experience. A CCNP award does not automatically grant CCIE. Check qualifying-exam validity and lab availability before booking.'},cisco+'ccie-enterprise-infrastructure/index.html',['identity','blueprint','price']);
  const falcon='https://www.crowdstrike.com/content/dam/crowdstrike/marketing/en-us/documents/pdfs/crowdstrike-university/ccfa-certification-guide.pdf';
  revise('crowdstrike-ccfa',{prerequisites:'Exam registrants must be 18 or older, accept the exam agreement and purchase a voucher. Six months of production Falcon experience and University access are recommended.',note:'Administrator credential: 60 questions in 90 minutes. Valid for three years; renew through the current exam under issuer policy. University and product access should be confirmed before starting. No responder or hunter credential is required.'},falcon,['identity','eligibility','blueprint','renewal']);
  revise('acp',{examFormat:'Axis Network Video Exam delivered through Pearson VUE. Confirm current duration and booking conditions.',note:'Use the Axis Certification Program knowledge check, practice test, Network Video Fundamentals training and technical guide. Confirm employer funding and current regional exam price.',studyMaterials:'Axis Certification Program and its linked preparation material; Pearson VUE for booking.'},'https://www.axis.com/learning/axis-certification-program',['identity']);
  for(const [id,name,code] of [['mcit','XProtect Certified Integration Technician','XCIT'],['mcde','XProtect Certified Design Engineer','XCDE'],['mcie','XProtect Certified Integration Engineer','XCIE']]){
    revise(id,{name,code,examFormat:'Check the current assessment guide in the Milestone Learning Portal; public format and delivery details were not verified.',prerequisites:'Check the current portal assessment guide. Previous-certification requirements must not be inferred from tracker learning order.',note:'XProtect certification milestone. Legacy internal ID retained to preserve progress. Current price, eligibility and renewal details require the issuer portal; no workplace funding or automatic completion is assumed.',studyMaterials:'Milestone Learning Portal and current XProtect documentation. Select the guide matching the current assessment name.'},'https://milestonesys.fuseuniversal.com/');
  }
  const restrictedCoverage={
    mcit:['XProtect deployment planning and system requirements','Installation and core system components','Devices, recording and storage configuration','Users, roles and operator clients','Events, rules, alarms and notifications','Maintenance and first-line troubleshooting'],
    mcde:['Requirements, edition and topology selection','Camera, scene and image-quality design','Bandwidth, storage and retention design','Server roles, sizing and distributed architecture','Availability, cybersecurity and recovery design','Integration, documentation and design assurance'],
    mcie:['Advanced XProtect architecture and component dependencies','Milestone Federated Architecture','XProtect Interconnect','Recording, storage and performance engineering','Events, rules, alarms and third-party integrations','Security, identity and certificate operations','Availability, backup, failover and recovery','Multi-layer troubleshooting and change validation'],
    acp:['Network video technologies and standards','Imaging, optics and scene requirements','Encoding, streaming, bandwidth and storage','IP networking and device cybersecurity','Installation, configuration and troubleshooting','Solution design, products and integrations'],
    'arcules-csp':['Cloud VSaaS value and suitable use cases','Arcules portfolio and service architecture','Connectivity, security and operational requirements','Cloud, on-premises and hybrid positioning','Licensing, commercial discovery and proposal fit','Customer outcomes, limitations and handover'],
    'briefcam-tech':['BriefCam User and Admin foundations','Installation, architecture and configuration','Review, Respond and Research workflows','Metadata, permissions and VMS integration','Administration, performance and troubleshooting','Privacy, auditability and human validation']
  };
  for(const[id,subjects]of Object.entries(restrictedCoverage)){
    const cert=byId[id];if(!cert)continue;
    cert.subjects=subjects;
    cert.coverage=subjects.join('; ')+'. Exact assessment weighting and private course objectives require the current authorised learning portal.';
    cert.coverageModel='ACCESS_RESTRICTED_EXPLICIT_FLOOR';
    cert.tutorBottlenecks=subjects.map(subject=>({subject,reason:`Demonstrate ${subject} through explanation, configuration or design, a controlled failure and evidence-led recovery before treating the subject as covered.`}));
  }
  revise('arcules-csp',{examFormat:'Partner assessment details require the current Milestone/Arcules portal.',note:'Sales-focused credential, not proof of technical integration capability. Current validity, assessment and pricing require portal confirmation; unknown validity is not a lifetime guarantee.',studyMaterials:'Milestone Learning Portal for the current authorised curriculum, supported by current Arcules product and support documentation.'},'https://milestonesys.fuseuniversal.com/');
  for(const id of ['a-plus','network-plus','security-plus']){
    revise(id,{note:'Use the current CompTIA objectives for the listed exam code. Current issuer pages could not be independently retrieved in this review; retirement predictions, discount promises and automatic cross-renewal claims are not assumed.',prerequisites:'Consult current CompTIA recommended experience. Tracker learning dependencies do not establish formal eligibility.',cost:'Current regional CompTIA price unverified; confirm official checkout',costNum:0},'https://www.comptia.org/certifications');
  }
  for(const cert of CERTS){cert.learningDependencies=[...(cert.deps||[])];cert.formalPrerequisites=cert.formalPrerequisites||[];}
})();
