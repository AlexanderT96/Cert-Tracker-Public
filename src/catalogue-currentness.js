// Cert Tracker — current-program compatibility layer (September 2026).
// Stable internal IDs are deliberately preserved so saved progress/filter state survives
// vendor renames. Display names, codes, requirements and source URLs follow current programmes.
(function refreshCatalogueCurrentness(){
  'use strict';
  if(typeof CERTS==='undefined'||!Array.isArray(CERTS))throw new Error('cert catalogue must load before catalogue-currentness.js');
  const VERIFIED='2026-09-02';
  const byId=Object.fromEntries(CERTS.map(cert=>[cert.id,cert]));
  const patch=(id,values)=>{if(byId[id])Object.assign(byId[id],values);};

  // Restricted physical-security ecosystems. Public pages establish that training exists;
  // partner-only naming, eligibility and renewal details remain deliberately provisional.
  const lenelValues={lca:2500,lcp:4500,lce:6500,lcda:8500};
  for(const id of Object.keys(lenelValues))patch(id,{
    validity:0,cvValue:lenelValues[id],cvValueConfidence:'LOW',cvValueScope:'UK enterprise physical-security roles with active LenelS2 delivery responsibility',verifiedAt:'2026-09-13',employer:true,
    sourceUrl:'https://www.lenels2.com/en/training/',officialUrl:'https://www.lenels2.com/en/training/',provider:'LenelS2',cost:'Restricted employer / authorised-partner training; confirm current price and entitlement in the partner portal',costStatus:'PARTNER_PORTAL_REQUIRED',
    renewalRule:'Current validity, product-update and renewal rules are not publicly verified; confirm them in the authorised LenelS2 learning portal before enrolment.',
    availabilityStatus:'PARTNER_VERIFICATION_REQUIRED'
  });
  patch('lca',{note:'Hidden employer-access foundation. A legacy Lenel training source publicly evidences the LCA designation, but current course, exam, validity and renewal details must be confirmed in the authorised portal. Career-value estimate is low-confidence and conditional on hands-on platform responsibility.'});
  patch('lcp',{note:'Hidden employer-access progression placeholder after LCA. The current LCP designation, eligibility, assessment and renewal details are not confirmed by a public cert-level source; verify all four in the authorised portal before treating this as bookable.'});
  patch('lce',{note:'Hidden employer-access advanced progression placeholder after LCP. Do not infer eligibility from a fixed deployment count: use the current partner-portal rules and demonstrated enterprise delivery evidence.'});
  patch('lcda',{note:'Hidden employer-access architecture-stage placeholder after LCE. Its high estimate reflects potential contextual scarcity in enterprise LenelS2 design work, not a guaranteed salary premium; confirm the current award and experience gate in the partner portal.'});

  // Fortinet rebuilt the certification programme into NSE 1-8 levels on 15 July 2026.
  // Keep legacy tracker IDs but never present retired FCP/FCSS/FCX branding as current.
  patch('nse-4',{
    name:'Fortinet NSE 4: FortiOS',code:'NSE 4',vendor:'Fortinet',validity:24,verifiedAt:VERIFIED,
    sourceUrl:'https://www.fortinet.com/training-certification',
    coverage:'Configure, operate and administer FortiGate / FortiOS on a day-to-day basis to secure networks and applications.',
    prerequisites:'No lower NSE certification is required. Current certification requires passing the proctored NSE 4 FortiOS exam.',
    studyMaterials:'Fortinet Training Institute NSE 4 FortiOS learning path, product documentation and hands-on FortiGate lab practice.',
    subjects:['FortiOS administration','Firewall policy','NAT and routing','VPN','Security profiles','Monitoring and troubleshooting'],
    skills:['FortiGate','FortiOS','Firewalling','NAT','VPN','Network security troubleshooting'],
    examFormat:'Current Fortinet NSE 4 proctored certification exam. Verify the active FortiOS exam version in the Training Institute immediately before booking.',
    projectRec:'Build a FortiGate lab with routed interfaces, policy/NAT, site-to-site VPN, security profiles, logging and a documented break/fix exercise.',
    note:'Current Fortinet foundation for the advanced NSE 5-8 programme. Older FCP branding is retired; the stable tracker ID is retained only to preserve saved state.'
  });
  patch('fcss-secops',{
    name:'Fortinet NSE 7: Security Operations',code:'NSE 7 SECURITY OPERATIONS',vendor:'Fortinet',validity:24,verifiedAt:VERIFIED,
    sourceUrl:'https://www.fortinet.com/training-certification',
    coverage:'Design, administer, monitor and troubleshoot advanced Fortinet security-operations solutions and infrastructures.',
    prerequisites:'Current programme requires active NSE 4 plus an active NSE 5 or NSE 6 in Security Operations, then the NSE 7 Security Operations proctored exam. The tracker keeps the intermediate either/or requirement in guidance rather than pretending it is a single hard dependency.',
    studyMaterials:'Fortinet Training Institute Security Operations track, current NSE 7 exam objectives, product labs and troubleshooting scenarios.',
    subjects:['Security operations architecture','Fortinet SOC products','Monitoring and investigation','Advanced troubleshooting','Security operations integrations'],
    skills:['Security operations','Fortinet','SOC','Monitoring','Troubleshooting'],
    examFormat:'NSE 7 Security Operations proctored exam after the current NSE prerequisite chain is satisfied.',
    projectRec:'Design and lab a Fortinet security-operations workflow showing telemetry ingestion, alert/investigation flow, response, integrations and failure diagnosis.',
    note:'This tracker ID formerly represented an FCSS-era record. FCSS was retired on 15 July 2026; this record now represents the current NSE 7 Security Operations rung without breaking historic state.'
  });
  patch('fcx',{
    name:'Fortinet NSE 8 Cybersecurity Expert',code:'NSE 8',vendor:'Fortinet',validity:24,verifiedAt:VERIFIED,
    sourceUrl:'https://www.fortinet.com/training-certification',
    coverage:'Expert network-security design, configuration, operation and troubleshooting across complex Fortinet environments.',
    prerequisites:'Current programme requires active NSE 4, active NSE 5 or NSE 6, active NSE 7 on the same track, then the NSE 8 Core practical and one NSE 8 Elective practical exam.',
    studyMaterials:'Fortinet Training Institute NSE 8 resources plus extensive production-equivalent multi-product lab practice.',
    subjects:['Expert Fortinet architecture','Complex network security design','Advanced troubleshooting','Cross-product integration','Operational validation'],
    skills:['Expert network security','Fortinet architecture','Troubleshooting','Integration'],
    examFormat:'Two practical exams: NSE 8 Core followed by one NSE 8 Elective. Current prerequisite certifications must be active before scheduling the Core.',
    projectRec:'Maintain an expert multi-site Fortinet lab portfolio with timed implementation, fault isolation, design decisions and cross-product integration evidence.',
    note:'FCX branding was retired on 15 July 2026. Stable tracker ID retained for saved-state compatibility; current credential is NSE 8.'
  });

  // CrowdStrike added an explicit entry-level Falcon Practitioner credential.
  patch('crowdstrike-ccf',{
    name:'CrowdStrike Certified Falcon Practitioner',code:'CCFP',vendor:'CrowdStrike',verifiedAt:VERIFIED,
    sourceUrl:'https://www.crowdstrike.com/en-us/crowdstrike-university/crowdstrike-falcon-certification-program/',
    coverage:'Foundational cybersecurity knowledge and entry-level proficiency using the CrowdStrike Falcon platform.',
    prerequisites:'No formal prerequisite stated; use CrowdStrike University learning and practical Falcon familiarity before attempting the exam.',
    studyMaterials:'CrowdStrike University CCFP exam guide, recommended learning and Falcon platform practice.',
    subjects:['Falcon platform fundamentals','Core cybersecurity concepts','Falcon navigation and workflows','Foundational detection context'],
    skills:['CrowdStrike Falcon','Endpoint security','Security operations fundamentals'],
    examFormat:'CrowdStrike Certified Falcon Practitioner role-based certification exam; use the current CCFP exam guide for objectives and logistics.',
    projectRec:'Document a basic Falcon operational workflow covering platform navigation, detections, host context, policy awareness and escalation decisions.',
    note:'CCFP is the current practitioner-level entry credential. The internal ID remains unchanged so existing filters and progress survive the programme refresh.'
  });

  // Cisco remains ENCOR + concentration for CCNP Enterprise. Cisco U training now references
  // ENCOR v1.2; avoid stale v1.1-only wording while keeping ENARSI as the deep-routing choice.
  patch('ccnp-enterprise',{
    verifiedAt:VERIFIED,
    sourceUrl:'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccnp-enterprise/index.html',
    note:'Current CCNP Enterprise structure remains 350-401 ENCOR plus one concentration. This roadmap intentionally selects 300-410 ENARSI for the strongest advanced-routing/troubleshooting curriculum. Re-check the active ENCOR blueprint before study because Cisco U training has moved to the newer ENCOR v1.2 content.'
  });
  patch('ccie-enterprise',{
    verifiedAt:VERIFIED,
    sourceUrl:'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccie-enterprise-infrastructure/index.html'
  });

  // Add the current Fortinet OT industry credential as a conditional specialist branch.
  if(!byId['fortinet-ot-security']){
    const cert={
      id:'fortinet-ot-security',name:'Fortinet Industry Certification: OT Security',code:'FORTINET OT SECURITY',phase:4,track:'ROLE-DRIVEN',gateway:false,tier:'B',vendor:'Fortinet',
      validity:24,cost:'Current proctored industry exam; verify regional fee',costNum:300,cvValue:2600,verifiedAt:VERIFIED,employer:false,free:false,cpe:0,cpePeriod:24,difficulty:8,roi:8,hours:[70,130],
      sourceUrl:'https://www.fortinet.com/training-certification',
      coverage:'Design, deploy and monitor advanced Fortinet security solutions for operational-technology environments.',
      prerequisites:'Current programme requires active NSE 4, active NSE 5 or NSE 6, an active NSE 7 on the same track, and the OT Security industry proctored exam. Treat this as a Fortinet-exposure branch, not a generic OT prerequisite.',
      studyMaterials:'Fortinet Training Institute OT Security curriculum, current industry-certification objectives and a segmented IT/OT FortiGate lab.',
      subjects:['OT security architecture','IT/OT segmentation','Fortinet OT controls','Industrial visibility and monitoring','OT secure remote access','OT troubleshooting'],
      skills:['OT security','Fortinet','Network segmentation','Industrial security','Firewalling'],
      examFormat:'Fortinet OT Security Industry Certification proctored exam after the active NSE prerequisite chain is satisfied.',
      projectRec:'Build an IT/OT segmentation design with zones/conduits, FortiGate policy, industrial asset visibility, remote-access controls, logging and an OT-focused failure-response runbook.',
      note:'Conditional vendor specialisation with high practical value only when Fortinet is present in the target environment. It supplements, rather than replaces, vendor-neutral ISA/IEC 62443 and GICSP learning.',
      deps:['nse-4','fcss-secops'],tracks:['B','C']
    };
    CERTS.push(cert);byId[cert.id]=cert;
  }

  // Catalogue-wide detail normalisation. The tracker contains many secondary role filters,
  // so sparse records must not collapse into thin cards just because they are outside My Path.
  // Missing fields are deliberately labelled as derived guidance, not invented vendor facts.
  for(const cert of CERTS){
    const explicitValue=Number(cert.cvValue);
    if(!Number.isFinite(explicitValue)||explicitValue<=0){
      const trackBase={CORE:2600,FOUNDATION:1100,CONDITIONAL:1800,OPTIONAL:1400,'ROLE-DRIVEN':2200,ARCHITECT:4800,'IDENTITY-SEC':2800,'POST-PLAN':3400,WIRELESS:2700,'PREREQUISITE-ONLY':800,'EXPERIENCE-GATED':6000,'CELLULAR-FOCUS':2600}[cert.track]||1600;
      const tierFactor={S:1.55,A:1.3,B:1.12,C:1,D:.82}[cert.tier]||1;
      const roiFactor=.7+Math.max(0,Math.min(10,Number(cert.roi)||5))/20;
      const difficultyFactor=.82+Math.max(0,Math.min(10,Number(cert.difficulty)||5))/30;
      const accessFactor=cert.employer?1.08:1;
      cert.cvValue=Math.max(500,Math.min(12000,Math.round(trackBase*tierFactor*roiFactor*difficultyFactor*accessFactor/100)*100));
      cert.cvValueBasis='MODELLED_FALLBACK';
    }else{
      cert.cvValue=explicitValue;
      cert.cvValueBasis=cert.cvValueBasis||'CATALOGUE_ESTIMATE';
    }
    cert.cvValueCurrency='GBP';
    cert.cvValueConfidence=cert.cvValueConfidence||(cert.pending||cert.employer?'LOW':'MEDIUM');
    cert.cvValueScope=cert.cvValueScope||'UK role-aligned earning-power planning signal; non-additive and not a guaranteed salary uplift';
    const topics=[...(cert.subjects||[]),...(cert.skills||[])].map(x=>String(x).trim()).filter(Boolean);
    const topicText=[...new Set(topics)].slice(0,6).join(', ')||cert.name||cert.code||'the certification domain';
    let derived=false;
    if(!cert.coverage){cert.coverage=`Structured learning coverage is derived from the recorded certification domains: ${topicText}. Use the current official blueprint as the authority for exact weighting and product-version changes.`;derived=true;}
    if(!cert.prerequisites){cert.prerequisites='No formal prerequisite is recorded in the tracker. Confirm current eligibility and recommended experience with the issuing body before booking.';derived=true;}
    if(!cert.examFormat){cert.examFormat='Assessment format is programme-dependent. Check the current official certification page for question/lab format, duration, delivery method, passing policy and active exam version before booking.';derived=true;}
    if(!cert.studyMaterials){cert.studyMaterials='Use the official blueprint/vendor learning path first, then the purpose-fit video, lab and practice resources in the Learning Intelligence panel.';derived=true;}
    if(!cert.projectRec){cert.projectRec=`Create practical evidence around ${topicText}: document the scenario, implementation or analysis, validation steps, failures encountered and what you would change in production.`;derived=true;}
    if(!cert.note){cert.note='Supporting learning rung. Judge it by the capability it builds and how it connects to the selected role pathway; market value is secondary. Re-verify current programme status before committing exam fees.';derived=true;}
    if(derived)cert.detailModel='DERIVED';
  }
})();
