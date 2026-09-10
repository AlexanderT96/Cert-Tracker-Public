// Cert Tracker — learning-resource + exam-depth intelligence.
// Public/generic only: every certification gets a purpose-fit resource stack and
// subject-by-subject depth guidance. Curated records override the generic model;
// all remaining catalogue entries receive clearly-labelled derived guidance.
(function initLearningResources(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT)throw new Error('config.js must load before learning-resources.js');

  const DEPTH=Object.freeze({
    1:Object.freeze({label:'Awareness',short:'Recognise',description:'Recognise the concept, terminology and basic purpose. You should be able to identify the right idea or product, but not necessarily configure it.'}),
    2:Object.freeze({label:'Working knowledge',short:'Explain',description:'Explain how it works, compare alternatives and identify common use cases, limitations and dependencies.'}),
    3:Object.freeze({label:'Applied',short:'Configure',description:'Apply the topic in routine scenarios: configure, use, validate and interpret normal results with limited guidance.'}),
    4:Object.freeze({label:'Advanced',short:'Troubleshoot / design',description:'Troubleshoot non-obvious failures, combine the topic with adjacent systems and make defensible implementation/design decisions.'}),
    5:Object.freeze({label:'Expert',short:'Optimise / integrate',description:'Operate under ambiguity and time pressure: integrate, optimise, diagnose complex interactions and justify expert-level trade-offs.'})
  });

  const PROVIDERS=Object.freeze({
    CompTIA:{training:'https://www.comptia.org/training',practice:'https://www.comptia.org/training/certmaster-practice',video:'Professor Messer'},
    Cisco:{training:'https://u.cisco.com/',practice:'https://www.boson.com/practice-exam',video:'Jeremy\'s IT Lab'},
    Microsoft:{training:'https://learn.microsoft.com/en-us/training/',practice:'https://learn.microsoft.com/en-us/credentials/certifications/practice-assessments-for-microsoft-certifications',video:'John Savill'},
    AWS:{training:'https://skillbuilder.aws/',practice:'https://portal.tutorialsdojo.com/course-category/aws-practice-exams/',video:'AWS Events'},
    'Amazon Web Services':{training:'https://skillbuilder.aws/',practice:'https://portal.tutorialsdojo.com/course-category/aws-practice-exams/',video:'AWS Events'},
    ISC2:{training:'https://www.isc2.org/training/online-self-paced',practice:'https://www.isc2.org/certifications',video:'Destination Certification'},
    '(ISC)²':{training:'https://www.isc2.org/training/online-self-paced',practice:'https://www.isc2.org/certifications',video:'Destination Certification'},
    'Palo Alto Networks':{training:'https://www.paloaltonetworks.com/services/education',practice:'https://www.paloaltonetworks.com/services/education/certification',video:'Palo Alto Networks'},
    'Palo Alto':{training:'https://www.paloaltonetworks.com/services/education',practice:'https://www.paloaltonetworks.com/services/education/certification',video:'Palo Alto Networks'},
    Fortinet:{training:'https://training.fortinet.com/',practice:'https://www.fortinet.com/training-certification',video:'Fortinet'},
    CrowdStrike:{training:'https://www.crowdstrike.com/crowdstrike-university/',practice:'https://www.crowdstrike.com/crowdstrike-university/certification/',video:'CrowdStrike'},
    'Python Institute':{training:'https://edube.org/',practice:'https://pythoninstitute.org/',video:'Python Institute'},
    ISA:{training:'https://www.isa.org/training',practice:'https://www.isa.org/certification',video:'International Society of Automation'},
    GIAC:{training:'https://www.sans.org/cyber-security-courses/',practice:'https://www.giac.org/certifications/',video:'SANS Institute'},
    BCS:{training:'https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/',practice:'https://www.bcs.org/qualifications-and-certifications/',video:'BCS'},
    Esri:{training:'https://www.esri.com/training/',practice:'https://www.esri.com/training/certification/',video:'Esri'},
    ArcGIS:{training:'https://www.esri.com/training/',practice:'https://www.esri.com/training/certification/',video:'Esri'},
    Splunk:{training:'https://education.splunk.com/',practice:'https://www.splunk.com/en_us/training/certification-track.html',video:'Splunk'},
    'TryHackMe':{training:'https://tryhackme.com/paths',practice:'https://tryhackme.com/paths',video:'TryHackMe'},
    'HackTheBox':{training:'https://academy.hackthebox.com/',practice:'https://academy.hackthebox.com/',video:'Hack The Box'},
    'Offensive Security':{training:'https://www.offsec.com/courses/',practice:'https://www.offsec.com/labs/',video:'OffSec'},
    'Linux Foundation':{training:'https://training.linuxfoundation.org/',practice:'https://training.linuxfoundation.org/certification/',video:'Linux Foundation'},
    HashiCorp:{training:'https://developer.hashicorp.com/certifications',practice:'https://developer.hashicorp.com/certifications',video:'HashiCorp'},
    ISACA:{training:'https://www.isaca.org/training-and-events',practice:'https://www.isaca.org/credentialing/certifications',video:'ISACA'},
    IAPP:{training:'https://iapp.org/train',practice:'https://iapp.org/certify',video:'IAPP'},
    ASIS:{training:'https://www.asisonline.org/certification/',practice:'https://www.asisonline.org/certification/',video:'ASIS International'},
    'Open Group':{training:'https://www.opengroup.org/certifications',practice:'https://www.opengroup.org/certifications',video:'The Open Group'},
    AXELOS:{training:'https://www.peoplecert.org/',practice:'https://www.peoplecert.org/',video:'PeopleCert'},
    PeopleCert:{training:'https://www.peoplecert.org/',practice:'https://www.peoplecert.org/',video:'PeopleCert'},
    'Security Blue Team':{training:'https://www.securityblue.team/',practice:'https://www.securityblue.team/',video:'Security Blue Team'},
    PortSwigger:{training:'https://portswigger.net/web-security',practice:'https://portswigger.net/web-security/all-labs',video:'PortSwigger'},
    CREST:{training:'https://www.crest-approved.org/skills-certifications-careers/crest-certifications/',practice:'https://www.crest-approved.org/skills-certifications-careers/crest-certifications/',video:'CREST'},
    PECB:{training:'https://pecb.com/en/education-and-certification-for-individuals',practice:'https://pecb.com/en/education-and-certification-for-individuals',video:'PECB'},
    'TCM Security':{training:'https://academy.tcm-sec.com/',practice:'https://certifications.tcm-sec.com/',video:'TCM Security'},
    'Zero-Point Security':{training:'https://training.zeropointsecurity.co.uk/',practice:'https://training.zeropointsecurity.co.uk/',video:'Zero-Point Security'},
    'Milestone Systems / BriefCam':{training:'https://www.milestonesys.com/learn-and-support/learning-and-performance/',practice:'https://www.milestonesys.com/learn-and-support/',video:'Milestone Systems'},
    Milestone:{training:'https://www.milestonesys.com/learn-and-support/learning-and-performance/',practice:'https://www.milestonesys.com/learn-and-support/',video:'Milestone Systems'},
    'Milestone Systems':{training:'https://www.milestonesys.com/learn-and-support/learning-and-performance/',practice:'https://www.milestonesys.com/learn-and-support/',video:'Milestone Systems'},
    Axis:{training:'https://www.axis.com/learning',practice:'https://www.axis.com/learning/certification-program',video:'Axis Communications'},
    'Axis Communications':{training:'https://www.axis.com/learning',practice:'https://www.axis.com/learning/certification-program',video:'Axis Communications'},
    LenelS2:{training:'https://www.lenels2.com/en/training/',practice:'https://www.lenels2.com/en/training/',video:'LenelS2'},
    Honeywell:{training:'https://buildings.honeywell.com/us/en/support/training',practice:'https://buildings.honeywell.com/us/en/support/training',video:'Honeywell Buildings'},
    Paxton:{training:'https://www.paxton-access.com/training/',practice:'https://www.paxton-access.com/training/',video:'Paxton Access'}
  });

  function yt(query){return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;}
  function udemy(query){return `https://www.udemy.com/courses/search/?q=${encodeURIComponent(query)}`;}
  function safeUrl(value){return /^https:\/\//i.test(String(value||''))?String(value):'';}
  function vendorKey(cert){
    const v=String(cert?.vendor||'').trim();
    if(PROVIDERS[v])return v;
    if(/^Microsoft/i.test(v))return'Microsoft';
    if(/^Cisco/i.test(v))return'Cisco';
    if(/CompTIA/i.test(v))return'CompTIA';
    if(/Amazon|AWS/i.test(v))return'AWS';
    if(/ISC2|\(ISC\)/i.test(v))return'ISC2';
    if(/Palo Alto/i.test(v))return'Palo Alto Networks';
    if(/Python/i.test(v))return'Python Institute';
    if(/Milestone|BriefCam/i.test(v))return'Milestone Systems';
    if(/Axis/i.test(v))return'Axis';
    if(/Esri|ArcGIS/i.test(v))return'Esri';
    if(/ISA/i.test(v))return'ISA';
    return v;
  }
  function provider(cert){return PROVIDERS[vendorKey(cert)]||null;}
  function certQuery(cert){return [cert.code,cert.name].filter(Boolean).join(' ');}
  function link(label,url,purpose,kind='resource',free=null,meta={}){return Object.freeze({label,url,purpose,kind,free,...meta});}
  function dedupe(rows){const seen=new Set();return rows.filter(row=>{if(!row?.url||seen.has(row.url))return false;seen.add(row.url);return true;});}

  const PLATFORMS=Object.freeze({
    tryhackme:Object.freeze({name:'TryHackMe',url:'https://tryhackme.com/paths',modes:Object.freeze(['Browser']),free:null,use:'Guided, gamified cyber pathways and browser-based hands-on labs.',limit:'Use for practical reinforcement; it does not replace an issuer blueprint or production experience.'}),
    htb:Object.freeze({name:'HTB Academy',url:'https://academy.hackthebox.com/',modes:Object.freeze(['Desktop browser','In-browser VM']),free:null,use:'Deeper guided offensive, defensive, networking and systems modules with practical exercises.',limit:'Best on a desktop with enough time for labs; avoid treating completion as exam readiness by itself.'}),
    portswigger:Object.freeze({name:'PortSwigger Web Security Academy',url:'https://portswigger.net/web-security',modes:Object.freeze(['Desktop browser']),free:true,use:'Dedicated web-application and API security explanations with interactive labs.',limit:'Purpose-built for web security; it is not a general cyber or networking course.'}),
    kodekloud:Object.freeze({name:'KodeKloud',url:'https://kodekloud.com/learning-paths/',modes:Object.freeze(['Desktop browser']),free:null,use:'Hands-on Linux, cloud, DevOps, Kubernetes, Docker, infrastructure-as-code and CI/CD paths.',limit:'Use the lab environment for applied competence; confirm exact certification objectives separately.'}),
    mimo:Object.freeze({name:'Mimo',url:'https://mimo.org/',modes:Object.freeze(['iOS / Android app','Desktop web']),free:null,use:'Mobile-friendly, bite-sized Python, JavaScript, TypeScript, SQL and web-development practice.',limit:'Strong for habit and syntax practice; move to a real editor and project before claiming applied competence.'}),
    sololearn:Object.freeze({name:'Sololearn',url:'https://www.sololearn.com/en/',modes:Object.freeze(['iOS / Android app','Desktop web']),free:true,use:'Bite-sized programming courses, quizzes and code practice across Python, JavaScript, SQL, C#, C++ and web topics.',limit:'Useful for retrieval and repetition; not a substitute for debugging and building a complete project.'}),
    microsoftLearn:Object.freeze({name:'Microsoft Learn',url:'https://learn.microsoft.com/en-us/training/',modes:Object.freeze(['Desktop web','Mobile browser']),free:true,use:'Official Microsoft modules, learning paths and selected interactive exercises.',limit:'Use the current credential study guide to select modules; the full catalogue is broader than any one exam.'}),
    ciscoNetAcad:Object.freeze({name:'Cisco Networking Academy / Skills for All',url:'https://www.netacad.com/courses/networking',modes:Object.freeze(['Desktop web']),free:null,use:'Structured networking foundations and Cisco-aligned learning with Packet Tracer routes.',limit:'Use a desktop for Packet Tracer labs and validate the current exam blueprint before booking.'}),
    bosonNetSim:Object.freeze({name:'Boson NetSim',url:'https://boson.com/netsim-cisco-network-simulator/',modes:Object.freeze(['Desktop browser','Tablet browser']),free:false,use:'Guided Cisco configuration, topology and troubleshooting labs with automated grading and a network designer.',limit:'Use for D3+ applied Cisco networking; it is paid, does not replace physical equipment or production experience, and is separate from Boson ExSim exam practice.'})
  });
  function platformLink(id,reason){const p=PLATFORMS[id];return link(`${p.name} · ${p.modes.join(' + ')}`,p.url,`${reason} ${p.use} Limitation: ${p.limit}`,'platform',p.free,{coverage:'PLATFORM',platformId:id,modes:p.modes,use:p.use,limit:p.limit,reviewedAt:'2026-09-10'});}
  function platformRecommendations(cert,topic,requiredDepth=null){
    const text=`${cert.name||''} ${cert.code||''} ${cert.vendor||''} ${topic||''}`.toLowerCase();
    const depth=requiredDepth==null?subjectDepth(cert,topic,0):CT.util.clamp(Number(requiredDepth)||1,1,5);
    const cisco=vendorKey(cert)==='Cisco'||/\bcisco\b|ccna|ccnp|ccie|encor|enarsi/.test(text),rows=[];
    if(/python|javascript|typescript|sql|html|css|react|programming|coding|software development|object-oriented|node\.?js|c#|c\+\+/.test(text)){rows.push(platformLink('mimo','Use for short mobile practice and continuity between full study sessions.'));rows.push(platformLink('sololearn','Use for mobile or desktop retrieval drills and language reinforcement.'));}
    if(/web security|web app|application security|appsec|burp|injection|xss|csrf|api security|pentest/.test(text))rows.unshift(platformLink('portswigger','Use as the dedicated legal web-security lab route.'));
    if(/cyber|soc|siem|incident|forensic|threat detection|pentest|active directory|security operations|vulnerability|malware|network security/.test(text))rows.push(platformLink('tryhackme','Use for guided practical context and an accessible first lab cycle.'));
    if(depth>=3&&/cyber|soc|incident|forensic|threat|pentest|active directory|network traffic|vulnerability|linux|windows|powershell/.test(text))rows.push(platformLink('htb','Use after foundations when a deeper desktop lab is justified.'));
    if(/kubernetes|docker|container|devops|linux|cloud|terraform|ansible|infrastructure as code|iac|ci\/cd|yaml|bash/.test(text))rows.push(platformLink('kodekloud','Use for structured desktop labs and role-based platform practice.'));
    if(vendorKey(cert)==='Microsoft'||/azure|entra|microsoft 365|powershell|defender|sentinel|purview/.test(text))rows.unshift(platformLink('microsoftLearn','Use as the official modular learning spine.'));
    if(cisco&&depth>=3&&/subnet|ipv4|ipv6|routing|switching|vlan|trunk|spanning tree|stp|etherchannel|acl|nat|dhcp|ospf|eigrp|bgp|wireless|network automation|network troubleshoot|device configuration/.test(text))rows.push(platformLink('bosonNetSim','Use after learning the concept to configure, break, diagnose and verify it in a graded topology.'));
    if(cisco||/networking fundamental|routing|switching|vlan|packet tracer/.test(text))rows.unshift(platformLink('ciscoNetAcad','Use for structured networking theory and topology practice.'));
    return Object.freeze(dedupe(rows).slice(0,3));
  }

  const STACK_OVERRIDES=Object.freeze({
    acp:Object.freeze([
      link('Axis Learning','https://www.axis.com/learning','Official Axis learning catalogue, training paths and practical course access','course',null),
      link('Axis Certification Program','https://www.axis.com/learning/certification-program','Current ACP scope, preparation route and exam administration','official',true)
    ]),
    mcie:Object.freeze([
      link('Milestone Learning and Performance','https://www.milestonesys.com/learn-and-support/learning-and-performance/','Official XProtect technical learning and certification route','course',null),
      link('Milestone documentation','https://doc.milestonesys.com/','Current product documentation for build, validation and troubleshooting practice','reference',true)
    ]),
    'crowdstrike-ccfa':Object.freeze([
      link('CrowdStrike University','https://www.crowdstrike.com/en-us/services/training-and-certification/crowdstrike-university/','Official Falcon administrator training route','course',null),
      link('CCFA certification guide','https://www.crowdstrike.com/content/dam/crowdstrike/marketing/en-us/documents/pdfs/crowdstrike-university/ccfa-certification-guide.pdf','Official audience, domains and preparation requirements','official',true)
    ]),
    'sc-500':Object.freeze([
      link('Microsoft SC-500 study guide','https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500','Official skills measured, domain changes and preparation resources','course',true),
      link('Microsoft Learn training','https://learn.microsoft.com/en-us/training/','Official modules and sandbox-supported learning; select SC-500 modules from the current credential page','course',true)
    ]),
    'security-plus':Object.freeze([
      link('Professor Messer SY0-701 course','https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/','Best free full-course spine','video',true),
      link('Professor Messer Security+ study resources','https://www.professormesser.com/sy0-701-certification-course/','Revision, study groups and objective-by-objective reinforcement','review',true)
    ]),
    ccna:Object.freeze([
      link("Jeremy's IT Lab CCNA course",'https://courses.jeremysitlab.com/p/ccna','Best free video + lab + flashcard spine','video',true),
      link('Cisco Skills for All','https://www.netacad.com/courses/networking','Official Cisco foundational/lab learning','course',true),
      link('Cisco Packet Tracer','https://www.netacad.com/courses/packet-tracer','Hands-on configuration and break/fix practice','lab',true)
    ]),
    'ccnp-enterprise':Object.freeze([
      link('Cisco ENCOR training','https://www.cisco.com/site/us/en/learn/training-certifications/training/courses/encor.html','Official ENCOR curriculum and current learning path','course',false),
      link('Cisco ENARSI training','https://www.cisco.com/site/us/en/learn/training-certifications/training/courses/enarsi.html','Official advanced-routing curriculum','course',false),
      link('Cisco U','https://u.cisco.com/','Primary guided learning platform for ENCOR/ENARSI','course',false),
      link('Boson ExSim','https://www.boson.com/practice-exam','High-quality Cisco practice exams','practice',false)
    ]),
    'ccie-enterprise':Object.freeze([
      link('Cisco CCIE Enterprise Infrastructure','https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccie-enterprise-infrastructure/index.html','Official blueprint, lab requirements and current policies','official',true),
      link('Cisco U','https://u.cisco.com/','Official expert-level learning paths','course',false),
      link('Cisco Modeling Labs','https://developer.cisco.com/modeling-labs/','Primary topology emulation environment','lab',false),
      link('EVE-NG','https://www.eve-ng.net/','Large-scale multi-vendor expert lab platform','lab',true)
    ]),
    'az-900':Object.freeze([
      link('Microsoft Learn AZ-900','https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/','Official blueprint, learning path and practice assessment','course',true),
      link('John Savill Azure Fundamentals',yt('John Savill AZ-900 Azure Fundamentals full course'),'Best-fit free visual explanation/revision','video',true)
    ]),
    'cissp':Object.freeze([
      link('ISC2 CISSP self-paced training','https://www.isc2.org/training/online-self-paced/cissp-online-self-paced','Official adaptive curriculum','course',false),
      link('Destination Certification CISSP',yt('Destination Certification CISSP mind map 2026'),'High-value conceptual revision and domain integration','video',true)
    ]),
    'aws-saa':Object.freeze([
      link('AWS Skill Builder','https://skillbuilder.aws/','Official AWS learning and labs','course',true),
      link('Tutorials Dojo AWS practice exams','https://portal.tutorialsdojo.com/course-category/aws-practice-exams/','Best-fit scenario-heavy practice','practice',false)
    ])
  });

  const SUBJECT_OVERRIDES=Object.freeze({
    'security-plus':Object.freeze([
      {topic:'General security concepts',depth:3,emphasis:'Moderate'},
      {topic:'Threats, vulnerabilities and mitigations',depth:4,emphasis:'High'},
      {topic:'Security architecture',depth:3,emphasis:'High'},
      {topic:'Security operations',depth:4,emphasis:'Very high'},
      {topic:'Security program management and oversight',depth:3,emphasis:'High'}
    ]),
    'network-plus':Object.freeze([
      {topic:'Networking concepts and protocols',depth:3,emphasis:'High'},
      {topic:'Network implementation',depth:3,emphasis:'High'},
      {topic:'Network operations',depth:3,emphasis:'High'},
      {topic:'Network security',depth:3,emphasis:'Moderate'},
      {topic:'Network troubleshooting',depth:4,emphasis:'Very high'}
    ]),
    ccna:Object.freeze([
      {topic:'Network fundamentals',depth:4,emphasis:'High'},
      {topic:'Network access: switching, VLANs and STP',depth:4,emphasis:'High'},
      {topic:'IP connectivity: routing, OSPF and forwarding',depth:4,emphasis:'Very high'},
      {topic:'IP services',depth:3,emphasis:'Moderate'},
      {topic:'Security fundamentals',depth:3,emphasis:'High'},
      {topic:'Automation and programmability',depth:3,emphasis:'Moderate'}
    ]),
    'ccnp-enterprise':Object.freeze([
      {topic:'Enterprise architecture and design',depth:4,emphasis:'High'},
      {topic:'Advanced routing: OSPF, BGP and route control',depth:5,emphasis:'Very high'},
      {topic:'Enterprise infrastructure and services',depth:4,emphasis:'Very high'},
      {topic:'VPN and transport technologies',depth:4,emphasis:'High'},
      {topic:'Network assurance and troubleshooting',depth:5,emphasis:'Very high'},
      {topic:'Infrastructure security',depth:4,emphasis:'High'},
      {topic:'Automation and programmability',depth:4,emphasis:'High'}
    ]),
    'ccie-enterprise':Object.freeze([
      {topic:'Expert routing, transport and path control',depth:5,emphasis:'Very high'},
      {topic:'Enterprise design and architecture trade-offs',depth:5,emphasis:'Very high'},
      {topic:'Software-defined infrastructure',depth:5,emphasis:'High'},
      {topic:'Infrastructure security and services',depth:5,emphasis:'High'},
      {topic:'Automation, APIs and programmability',depth:5,emphasis:'High'},
      {topic:'Timed fault isolation, optimisation and validation',depth:5,emphasis:'Very high'}
    ]),
    'az-900':Object.freeze([
      {topic:'Cloud concepts',depth:2,emphasis:'High'},
      {topic:'Azure architecture and core services',depth:2,emphasis:'Very high'},
      {topic:'Azure management and governance',depth:2,emphasis:'High'}
    ]),
    'sc-900':Object.freeze([
      {topic:'Security, compliance and identity concepts',depth:2,emphasis:'High'},
      {topic:'Microsoft Entra capabilities',depth:2,emphasis:'High'},
      {topic:'Microsoft security solutions',depth:2,emphasis:'High'},
      {topic:'Microsoft compliance solutions',depth:2,emphasis:'High'}
    ]),
    'ai-901':Object.freeze([
      {topic:'AI concepts and responsible AI',depth:2,emphasis:'High'},
      {topic:'Machine learning and model concepts',depth:2,emphasis:'High'},
      {topic:'Computer vision',depth:2,emphasis:'Moderate'},
      {topic:'Natural language processing and generative AI',depth:2,emphasis:'High'},
      {topic:'Microsoft Foundry implementation concepts',depth:2,emphasis:'High'}
    ]),
    'az-104':Object.freeze([
      {topic:'Azure identities and governance',depth:4,emphasis:'High'},
      {topic:'Storage',depth:3,emphasis:'High'},
      {topic:'Compute',depth:4,emphasis:'High'},
      {topic:'Virtual networking',depth:4,emphasis:'Very high'},
      {topic:'Monitoring and maintenance',depth:3,emphasis:'High'}
    ]),
    'az-802':Object.freeze([
      {topic:'Active Directory Domain Services and DNS',depth:4,emphasis:'Very high'},
      {topic:'Windows Server security and PKI',depth:4,emphasis:'High'},
      {topic:'Hyper-V and virtualization',depth:4,emphasis:'High'},
      {topic:'Windows Server networking',depth:4,emphasis:'High'},
      {topic:'Storage and file services',depth:4,emphasis:'High'},
      {topic:'Monitoring, troubleshooting and recovery',depth:4,emphasis:'Very high'}
    ]),
    'sc-200':Object.freeze([
      {topic:'Microsoft Sentinel and SIEM operations',depth:4,emphasis:'Very high'},
      {topic:'Microsoft Defender XDR',depth:4,emphasis:'Very high'},
      {topic:'KQL detection and investigation',depth:4,emphasis:'High'},
      {topic:'Incident response and threat hunting',depth:4,emphasis:'High'}
    ]),
    'sc-300':Object.freeze([
      {topic:'Identity lifecycle and Entra administration',depth:4,emphasis:'Very high'},
      {topic:'Authentication and access management',depth:4,emphasis:'Very high'},
      {topic:'Workload identities and applications',depth:4,emphasis:'High'},
      {topic:'Identity governance',depth:4,emphasis:'High'}
    ]),
    'sc-500':Object.freeze([
      {topic:'Cloud identity and governance security',depth:4,emphasis:'High'},
      {topic:'Network, storage and database security',depth:4,emphasis:'Very high'},
      {topic:'Compute and workload security',depth:4,emphasis:'High'},
      {topic:'Security posture and Defender capabilities',depth:4,emphasis:'High'},
      {topic:'AI workload and data security',depth:4,emphasis:'High'}
    ]),
    'sc-100':Object.freeze([
      {topic:'Security strategy and architecture',depth:5,emphasis:'Very high'},
      {topic:'Zero Trust and identity architecture',depth:5,emphasis:'High'},
      {topic:'Security operations architecture',depth:4,emphasis:'High'},
      {topic:'Infrastructure and application security architecture',depth:5,emphasis:'Very high'}
    ]),
    'az-305':Object.freeze([
      {topic:'Identity, governance and monitoring design',depth:4,emphasis:'High'},
      {topic:'Data storage architecture',depth:4,emphasis:'High'},
      {topic:'Business continuity and resilience',depth:4,emphasis:'High'},
      {topic:'Infrastructure architecture',depth:5,emphasis:'Very high'}
    ]),
    pcep:Object.freeze([
      {topic:'Python syntax, literals and operators',depth:3,emphasis:'High'},
      {topic:'Control flow',depth:3,emphasis:'High'},
      {topic:'Data collections',depth:3,emphasis:'High'},
      {topic:'Functions and exceptions',depth:3,emphasis:'High'}
    ]),
    pcap:Object.freeze([
      {topic:'Modules, packages and namespaces',depth:4,emphasis:'High'},
      {topic:'Strings and advanced data processing',depth:4,emphasis:'High'},
      {topic:'Object-oriented programming',depth:4,emphasis:'Very high'},
      {topic:'Exceptions, generators and file processing',depth:4,emphasis:'High'}
    ]),
    pcpp1:Object.freeze([
      {topic:'Advanced object-oriented Python',depth:5,emphasis:'Very high'},
      {topic:'Network programming and APIs',depth:4,emphasis:'High'},
      {topic:'GUI, files and data processing',depth:4,emphasis:'High'},
      {topic:'Advanced language features and patterns',depth:5,emphasis:'High'}
    ]),
    'iec-62443-cfs':Object.freeze([
      {topic:'Industrial automation and control-system security concepts',depth:3,emphasis:'Very high'},
      {topic:'ISA/IEC 62443 standards structure and terminology',depth:4,emphasis:'Very high'},
      {topic:'Zones, conduits and security levels',depth:4,emphasis:'High'},
      {topic:'Industrial cybersecurity lifecycle',depth:3,emphasis:'High'}
    ]),
    'iec-62443-cra':Object.freeze([
      {topic:'OT asset and system risk assessment',depth:5,emphasis:'Very high'},
      {topic:'Threat, vulnerability and consequence analysis',depth:5,emphasis:'Very high'},
      {topic:'Zones, conduits and target security levels',depth:5,emphasis:'High'},
      {topic:'Risk-treatment decisions and documentation',depth:4,emphasis:'High'}
    ]),
    'iec-62443-cds':Object.freeze([
      {topic:'Secure IACS architecture and design',depth:5,emphasis:'Very high'},
      {topic:'Segmentation, zones and conduits',depth:5,emphasis:'Very high'},
      {topic:'Security requirements and control selection',depth:5,emphasis:'High'},
      {topic:'Secure integration and lifecycle design',depth:4,emphasis:'High'}
    ]),
    'iec-62443-cms':Object.freeze([
      {topic:'IACS security programme maintenance',depth:4,emphasis:'Very high'},
      {topic:'Operations, monitoring and change',depth:4,emphasis:'High'},
      {topic:'Patch, vulnerability and incident processes',depth:4,emphasis:'High'},
      {topic:'Continuous improvement and lifecycle evidence',depth:4,emphasis:'High'}
    ]),
    'isa95-fund':Object.freeze([
      {topic:'ISA-95 / IEC 62264 models and terminology',depth:4,emphasis:'Very high'},
      {topic:'Enterprise-control boundaries and levels',depth:4,emphasis:'Very high'},
      {topic:'Manufacturing operations and information flows',depth:4,emphasis:'High'},
      {topic:'ERP/MES/control-system integration',depth:4,emphasis:'High'}
    ]),
    'isa-cap-associate':Object.freeze([
      {topic:'Automation and control-system fundamentals',depth:4,emphasis:'Very high'},
      {topic:'Instrumentation, measurement and I/O',depth:4,emphasis:'High'},
      {topic:'Control strategies and system architecture',depth:4,emphasis:'Very high'},
      {topic:'Automation lifecycle and project execution',depth:4,emphasis:'High'}
    ]),
    'isa-cap':Object.freeze([
      {topic:'Automation engineering body of knowledge',depth:5,emphasis:'Very high'},
      {topic:'Control-system design and lifecycle ownership',depth:5,emphasis:'Very high'},
      {topic:'Project, integration and responsible-charge decisions',depth:5,emphasis:'Very high'}
    ]),
    gicsp:Object.freeze([
      {topic:'ICS architecture and industrial protocols',depth:4,emphasis:'Very high'},
      {topic:'ICS risk, threats and vulnerabilities',depth:4,emphasis:'Very high'},
      {topic:'ICS defence, monitoring and incident response',depth:4,emphasis:'High'},
      {topic:'Safety, reliability and cyber-physical consequences',depth:4,emphasis:'High'}
    ]),
    'bcs-arch-found':Object.freeze([
      {topic:'Architecture concepts and viewpoints',depth:3,emphasis:'Very high'},
      {topic:'Architecture domains and lifecycle',depth:3,emphasis:'High'},
      {topic:'Requirements, stakeholders and trade-offs',depth:3,emphasis:'High'}
    ]),
    'bcs-arch-solution':Object.freeze([
      {topic:'Solution architecture design and decomposition',depth:4,emphasis:'Very high'},
      {topic:'Requirements, constraints and quality attributes',depth:4,emphasis:'High'},
      {topic:'Integration, interfaces and deployment choices',depth:4,emphasis:'High'},
      {topic:'Architecture documentation and decisions',depth:4,emphasis:'High'}
    ]),
    'bcs-arch-security':Object.freeze([
      {topic:'Security architecture principles and patterns',depth:4,emphasis:'Very high'},
      {topic:'Threat/risk-driven architecture',depth:4,emphasis:'High'},
      {topic:'Identity, trust boundaries and control architecture',depth:4,emphasis:'High'},
      {topic:'Security design assurance and trade-offs',depth:4,emphasis:'High'}
    ]),
    cissp:Object.freeze([
      {topic:'Security and risk management',depth:4,emphasis:'Very high'},
      {topic:'Asset security',depth:4,emphasis:'High'},
      {topic:'Security architecture and engineering',depth:4,emphasis:'Very high'},
      {topic:'Communication and network security',depth:4,emphasis:'High'},
      {topic:'Identity and access management',depth:4,emphasis:'High'},
      {topic:'Security assessment and testing',depth:4,emphasis:'High'},
      {topic:'Security operations',depth:4,emphasis:'Very high'},
      {topic:'Software development security',depth:3,emphasis:'Moderate'}
    ]),
    ccsp:Object.freeze([
      {topic:'Cloud concepts, architecture and design',depth:4,emphasis:'Very high'},
      {topic:'Cloud data security',depth:4,emphasis:'High'},
      {topic:'Cloud platform and infrastructure security',depth:4,emphasis:'Very high'},
      {topic:'Cloud application security',depth:4,emphasis:'High'},
      {topic:'Cloud security operations',depth:4,emphasis:'High'},
      {topic:'Legal, risk and compliance',depth:3,emphasis:'High'}
    ]),
    issap:Object.freeze([
      {topic:'Security architecture governance and risk',depth:5,emphasis:'Very high'},
      {topic:'Security architecture modelling and design',depth:5,emphasis:'Very high'},
      {topic:'Identity, infrastructure and application architecture',depth:5,emphasis:'Very high'},
      {topic:'Architecture validation and lifecycle integration',depth:5,emphasis:'High'}
    ]),
    'briefcam-tech':Object.freeze([
      {topic:'BriefCam architecture and deployment',depth:3,emphasis:'High'},
      {topic:'Analytics configuration and forensic search',depth:4,emphasis:'Very high'},
      {topic:'Alerts, metadata and VMS integration',depth:4,emphasis:'High'},
      {topic:'Administration and troubleshooting',depth:4,emphasis:'Very high'}
    ]),
    acp:Object.freeze([
      {topic:'IP video and network fundamentals',depth:4,emphasis:'High'},
      {topic:'Axis product/system design',depth:4,emphasis:'High'},
      {topic:'Image quality, video streaming and bandwidth',depth:4,emphasis:'Very high'},
      {topic:'Installation, configuration and troubleshooting',depth:4,emphasis:'Very high'}
    ]),
    mcie:Object.freeze([
      {topic:'XProtect architecture and advanced configuration',depth:4,emphasis:'Very high'},
      {topic:'Recording, storage and performance design',depth:4,emphasis:'High'},
      {topic:'Network, service and integration troubleshooting',depth:4,emphasis:'Very high'},
      {topic:'Security, resilience and operational design',depth:4,emphasis:'High'}
    ])
  });

  function baseDepth(cert){
    const text=`${cert.name||''} ${cert.code||''} ${cert.track||''}`.toLowerCase();
    if(/ccie|expert|principal|pcpp2|architect/.test(text))return 5;
    if(/ccnp|professional|specialist|engineer|administrator|associate|cissp|ccsp|giac|gicsp|pcap|pcpp/.test(text))return 4;
    if(/fundamental|foundation|apprentice|entry|sales/.test(text))return 2;
    const d=Number(cert.difficulty||0);if(d>=9)return 5;if(d>=7)return 4;if(d>=4)return 3;return 2;
  }
  function inferredSubjects(cert){
    let rows=Array.isArray(cert.subjects)&&cert.subjects.length?cert.subjects:Array.isArray(cert.skills)&&cert.skills.length?cert.skills:[];
    if(!rows.length&&cert.coverage){rows=String(cert.coverage).split(/[;,]/).map(x=>x.trim()).filter(x=>x.length>3).slice(0,8);}
    if(!rows.length)rows=[cert.name||cert.code||'Certification scope'];
    return [...new Set(rows.map(x=>String(x).trim()).filter(Boolean))].slice(0,10);
  }
  function subjectDepth(cert,topic,index){
    let d=baseDepth(cert);if(index>=2)d=Math.max(1,d-1);
    if(/troubleshoot|routing|architecture|design|incident|automation|program|risk|security|integration|forensic|identity|network|control|protocol/i.test(topic))d=Math.min(5,d+1);
    if(/fundamental|concept|overview|awareness/i.test(topic))d=Math.min(d,2);
    return CT.util.clamp(d,1,5);
  }
  function videoProvider(cert){const p=provider(cert);if(cert.id==='ccna')return"Jeremy's IT Lab";if(cert.id==='ccnp-enterprise'||cert.id==='ccie-enterprise')return'Kevin Wallace OR David Bombal';return p?.video||vendorKey(cert)||'expert tutorial';}
  function topicResources(cert,topic,requiredDepth=null){
    const p=provider(cert),query=certQuery(cert),subject=String(topic);
    const official=safeUrl(cert.sourceUrl);
    const rows=[];
    if(official)rows.push(link('Official blueprint',official,`Authoritative ${subject} scope and current exam requirements`,'official',true));
    if(p?.training)rows.push(link('Primary course',p.training,`Official/vendor learning for ${subject}`,'course',null));
    rows.push(...platformRecommendations(cert,subject,requiredDepth));
    rows.push(link('Best-fit video',yt(`${videoProvider(cert)} ${query} ${subject}`),`Visual explanation of ${subject} aligned to ${cert.code||cert.name}`,'video',true));
    const vendor=vendorKey(cert);
    if(vendor==='Cisco')rows.push(link('Hands-on lab',cert.id==='ccna'?'https://www.netacad.com/courses/packet-tracer':'https://developer.cisco.com/modeling-labs/',`Configure and break/fix ${subject}`,'lab',cert.id==='ccna'));
    else if(vendor==='Microsoft')rows.push(link('Hands-on Microsoft Learn',`https://learn.microsoft.com/en-us/search/?terms=${encodeURIComponent(subject)}`,`Microsoft Learn modules and sandboxes for ${subject}`,'lab',true));
    else if(vendor==='AWS'||vendor==='Amazon Web Services')rows.push(link('AWS Skill Builder lab','https://skillbuilder.aws/',`AWS hands-on practice for ${subject}`,'lab',null));
    else if(/TryHackMe|HackTheBox|Offensive Security|Security Blue Team/.test(vendor))rows.push(link('Hands-on platform',p?.training||'https://tryhackme.com/paths',`Practice ${subject} in guided labs`,'lab',null));
    else if(/ISA|GIAC/.test(vendor))rows.push(link('Scenario / lab search',yt(`${cert.code||cert.name} ${subject} lab industrial control systems`),`Find practical demonstrations for ${subject}`,'lab',true));
    else rows.push(link('Hands-on search',yt(`${query} ${subject} hands-on lab`),`Find a practical exercise for ${subject}`,'lab',true));
    if(p?.practice)rows.push(link('Practice / readiness',p.practice,`Validate exam-level recall and scenario judgement for ${subject}`,'practice',null));
    return Object.freeze(dedupe(rows));
  }
  function subjectCoverage(cert){
    const curated=SUBJECT_OVERRIDES[cert.id];
    const raw=curated||inferredSubjects(cert).map((topic,index)=>({topic,depth:subjectDepth(cert,topic,index),emphasis:index<2?'High':'Supporting'}));
    return Object.freeze(raw.map(row=>Object.freeze({
      topic:row.topic,depth:CT.util.clamp(Number(row.depth)||2,1,5),emphasis:row.emphasis||'Supporting',depthInfo:DEPTH[CT.util.clamp(Number(row.depth)||2,1,5)],resources:topicResources(cert,row.topic,row.depth)
    })));
  }
  function overallStack(cert){
    const p=provider(cert),query=certQuery(cert),official=safeUrl(cert.sourceUrl),rows=[];
    if(official)rows.push(link('Official exam / certification page',official,'Start here: current scope, objectives, prerequisites and policies','official',true));
    if(p?.training)rows.push(link('Primary learning path',p.training,'Main structured course or vendor learning portal','course',null));
    (STACK_OVERRIDES[cert.id]||[]).forEach(row=>rows.push(row));
    rows.push(...platformRecommendations(cert,inferredSubjects(cert).join(' ')));
    rows.push(link('Best-fit video search',yt(`${videoProvider(cert)} ${query} full course`),'Free visual course/revision option','video',true));
    if(p?.practice)rows.push(link('Practice / readiness',p.practice,'Exam-style practice and gap finding','practice',null));
    if(vendorKey(cert)==='Cisco')rows.push(link('Cisco Press search',`https://www.ciscopress.com/search/index.aspx?query=${encodeURIComponent(cert.code||cert.name)}`,'Deep-reference book / official-cert-guide route','book',false));
    if(vendorKey(cert)==='CompTIA'&&!['a-plus','network-plus','security-plus'].includes(cert.id))rows.push(link('Udemy course search',udemy(cert.code||cert.name),'Compare high-rated full courses when free coverage is incomplete','course',false));
    return Object.freeze(dedupe(rows).slice(0,7));
  }
  function profile(cert){
    const subjects=subjectCoverage(cert),stack=overallStack(cert);
    return Object.freeze({certId:cert.id,curated:!!SUBJECT_OVERRIDES[cert.id],model:SUBJECT_OVERRIDES[cert.id]?'CURATED':'DERIVED',subjects,stack,legacy:cert.studyMaterials||'',official:safeUrl(cert.sourceUrl)});
  }
  const discoveryUrl=url=>/youtube\.com\/results|udemy\.com\/courses\/search/.test(url||'');
  function validate(){return CERTS.map(cert=>profile(cert)).every(p=>p.subjects.length&&p.subjects.every(s=>s.depth>=1&&s.depth<=5&&s.resources.length>=3&&s.resources.some(r=>!discoveryUrl(r.url))&&s.resources.every(r=>/^https:\/\//.test(r.url)))&&p.stack.length>=3);}

  CT.learningResources=Object.freeze({DEPTH,PROVIDERS,PLATFORMS,SUBJECT_OVERRIDES,STACK_OVERRIDES,profile,subjectCoverage,overallStack,topicResources,platformRecommendations,validate});
})(window);
