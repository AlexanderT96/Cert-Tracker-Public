// Cert Tracker — audited source-registry extensions for current role-based programmes.
(function extendSourceRegistry(global){
  'use strict';
  const CT=global.CertTrackerV3;if(!CT?.sourceRegistry)return;
  const VERIFIED='2026-09-02';
  const extra={
    cwna:{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.cwnp.com/certifications/cwna',note:'Official CWNP CWNA page; current CWNA-109 and CWNA-110 transition are disclosed.'},
    'cisco-meraki-solutions':{level:'CERT',verifiedAt:'2026-09-11',url:'https://learningnetwork.cisco.com/s/ecms-exam-topics',note:'Official Cisco Learning Network 500-220 ECMS exam topics.'},
    cwap:{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.cwnp.com/certifications/cwap',note:'Official CWNP CWAP page.'},
    cwdp:{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.cwnp.com/certifications/cwdp',note:'Official CWNP CWDP page.'},
    cwsp:{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.cwnp.com/certifications/cwsp',note:'Official CWNP CWSP page.'},
    cwisa:{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.cwnp.com/certifications/cwisa',note:'Official CWNP CWISA page; represented only because it is a current CWNE requirement.'},
    cwne:{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.cwnp.com/certifications/cwne',note:'Official CWNP expert application and experience requirements.'},
    'nokia-5g-associate':{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.nokia.com/networks/training/bell-labs/',note:'Official Nokia Bell Labs vendor-agnostic 5G certification programme overview.'},
    'nokia-5g-networking':{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.nokia.com/networks/training/bell-labs/',note:'Official programme lists 5G Networking as a Professional certification domain.'},
    'nokia-5g-slicing':{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.nokia.com/networks/training/bell-labs/',note:'Official programme lists 5G Network Slicing as a Professional certification domain.'},
    'nokia-5g-security':{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.nokia.com/networks/training/bell-labs/',note:'Official programme lists 5G Secured Networks as a Professional certification domain.'},
    'nokia-5g-cloud':{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.nokia.com/networks/training/bell-labs/',note:'Official programme lists Distributed Cloud Networks as a Professional certification domain.'},
    'nokia-5g-industrial':{level:'CERT',verifiedAt:'2026-09-11',url:'https://www.nokia.com/networks/training/bell-labs/',note:'Official programme lists Industrial Automation Networks as a Professional certification domain.'},
    'pan-netsec-pro':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-netsec-professional',note:'Official Palo Alto Networks Network Security Professional certification page; current Professional-level Network Security credential.'},
    'pan-ngfw-eng':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-ngfw-engineer',note:'Official Palo Alto Networks Next-Generation Firewall Engineer certification page; current Specialist-level NGFW engineering credential.'},
    'pan-sse-eng':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-sse-engineer',note:'Official Palo Alto Networks Security Service Edge Engineer certification page; current Specialist-level SSE credential.'},
    'pan-netsec-arch':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-netsec-architect',note:'Official Palo Alto Networks Network Security Architect page; architect-level target audience states 5+ years architecting for Zero Trust across Network Security and 2+ years Palo Alto Networks hands-on experience.'},
    'pan-secops-arch':{level:'CERT',verifiedAt:VERIFIED,url:'https://www.paloaltonetworks.com/services/education/palo-alto-networks-secops-architect',note:'Official Palo Alto Networks Security Operations Architect page; intended for 5+ years designing security operations/IR/detection-prevention solutions and 2+ years Palo Alto Networks hands-on experience.'}
  };
  // Explicit per-ID provenance. Never infer the issuer from coverage text.
  // sourceCheckedAt records a source-identity check only; it must not refresh
  // catalogue verifiedAt or priceCheckedAt. CERT may be an official catalogue
  // explicitly naming the credential; VENDOR is only an issuer/programme route.
  const coverage = {
    'crowdstrike-ccfa':{url:'https://www.crowdstrike.com/content/dam/crowdstrike/marketing/en-us/documents/pdfs/crowdstrike-university/ccfa-certification-guide.pdf',level:'CERT',sourceCheckedAt:'2026-09-03',note:'Official administrator guide; distinct from the practitioner credential. Source check is not a price or full-field verification.'},
    'ai-103':{url:'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/',level:'CERT',sourceCheckedAt:'2026-09-03',note:'Official certification page. Source identity checked; verify regional price and current exam availability before booking.'},
    "pcep": {
      "url": "https://pythoninstitute.org/pcep",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "pcap": {
      "url": "https://pythoninstitute.org/pcap",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "pcpp1": {
      "url": "https://pythoninstitute.org/pcpp1",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "pcpp2": {
      "url": "https://pythoninstitute.org/pcpp2",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Programme page says in development; not a currently bookable exam.",
      "credentialStatus": "IN_DEVELOPMENT"
    },
    "jsnad": {
      "url": "https://training.linuxfoundation.org/jsnad-cert-inactive/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official retirement notice: 30 September 2025.",
      "credentialStatus": "RETIRED"
    },
    "jsnsd": {
      "url": "https://training.linuxfoundation.org/jsnsd-cert-inactive/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official retirement notice: 30 September 2025.",
      "credentialStatus": "RETIRED"
    },
    "ukcsc-assoc": {
      "url": "https://www.ukcybersecuritycouncil.org.uk/for-individuals/become-professionally-registered",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme explicitly identifies all four professional registration titles."
    },
    "ukcsc-pract": {
      "url": "https://www.ukcybersecuritycouncil.org.uk/for-individuals/become-professionally-registered",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme explicitly identifies all four professional registration titles."
    },
    "ukcsc-princ": {
      "url": "https://www.ukcybersecuritycouncil.org.uk/for-individuals/become-professionally-registered",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme explicitly identifies all four professional registration titles."
    },
    "ukcsc-chart": {
      "url": "https://www.ukcybersecuritycouncil.org.uk/for-individuals/become-professionally-registered",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme explicitly identifies all four professional registration titles."
    },
    "genetec-sc-ent": {
      "url": "https://www.genetec.com/support/training/course-list/sc-etc-001",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "genetec-omnicast-tech": {
      "url": "https://www.genetec.com/nl/support/training/cursuslijst",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official course list identifies Omnicast SC-OTC-001 and Synergis SC-STC-001."
    },
    "genetec-synergis-tech": {
      "url": "https://www.genetec.com/nl/support/training/cursuslijst",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official course list identifies Omnicast SC-OTC-001 and Synergis SC-STC-001."
    },
    "cks": {
      "url": "https://www.cncf.io/training/certification/cks/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "kcsa": {
      "url": "https://www.cncf.io/training/certification/kcsa/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "htb-cjca": {
      "url": "https://academy.hackthebox.com/preview/certifications/htb-certified-junior-cybersecurity-associate",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official title is Certified Junior Cybersecurity Associate, not Analyst."
    },
    "htb-cpts": {
      "url": "https://academy.hackthebox.com/preview/certifications/htb-certified-penetration-testing-specialist",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "htb-cdsa": {
      "url": "https://help.hackthebox.com/en/articles/12741732-academy-certifications",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Academy certification catalogue explicitly lists CDSA."
    },
    "pnpt": {
      "url": "https://certifications.tcm-sec.com/pnpt/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "crest-crt": {
      "url": "https://www.crest-approved.org/skills-certifications-careers/crest-registered-penetration-tester/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "crest-cct": {
      "url": "https://www.crest-approved.org/skills-certifications-careers/crest-certified-infrastructure-tester/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "crto": {
      "url": "https://www.zeropointsecurity.co.uk/course/red-team-ops",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "bscp": {
      "url": "https://portswigger.net/web-security/certification",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "btl1": {
      "url": "https://www.centri.org/certifications/blue-team-level-1",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "btl2": {
      "url": "https://www.centri.org/certifications/blue-team-level-2",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "oscp": {
      "url": "https://help.offsec.com/hc/en-us/articles/36010548001812-Renewing-OffSec-Certification-by-Taking-a-Qualifying-Certification-Exam",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official certification guidance explicitly lists this credential; consult associated course for booking details."
    },
    "osep": {
      "url": "https://help.offsec.com/hc/en-us/articles/36010548001812-Renewing-OffSec-Certification-by-Taking-a-Qualifying-Certification-Exam",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official certification guidance explicitly lists this credential; consult associated course for booking details."
    },
    "oswe": {
      "url": "https://help.offsec.com/hc/en-us/articles/36010548001812-Renewing-OffSec-Certification-by-Taking-a-Qualifying-Certification-Exam",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official certification guidance explicitly lists this credential; consult associated course for booking details."
    },
    "osed": {
      "url": "https://help.offsec.com/hc/en-us/articles/36010548001812-Renewing-OffSec-Certification-by-Taking-a-Qualifying-Certification-Exam",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official certification guidance explicitly lists this credential; consult associated course for booking details."
    },
    "osee": {
      "url": "https://help.offsec.com/hc/en-us/articles/36010548001812-Renewing-OffSec-Certification-by-Taking-a-Qualifying-Certification-Exam",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official certification guidance explicitly lists this credential; consult associated course for booking details."
    },
    "nozomi-cert-eng": {
      "url": "https://academy.nozominetworks.com/certified-engineer-exam",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "csyp": {
      "url": "https://www.charteredsecurityprofessional.org/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "asis-psp": {
      "url": "https://www.credly.com/org/asis-international/badge/physical-security-professional-psp",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Issuer-owned ASIS credential page."
    },
    "iso-27001-li": {
      "url": "https://pecb.com/en/education-and-certification-for-individuals/iso-iec-27001/iso-iec-27001-lead-implementer",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "PECB route used as an explicit provider example; requirements differ between awarding bodies."
    },
    "aigp": {
      "url": "https://iapp.org/certify/aigp",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "cipp-e": {
      "url": "https://iapp.org/certify/cippe",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "cipm": {
      "url": "https://iapp.org/certify/cipm",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "ccsk": {
      "url": "https://cloudsecurityalliance.org/education/ccsk",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "cczt": {
      "url": "https://cloudsecurityalliance.org/education/cczt",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "pragmatic-pmc": {
      "url": "https://www.pragmaticinstitute.com/product/course/foundations/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Foundations page explains the Foundations/Focus/Build Product Manager certification path."
    },
    "pragmatic-pcpm": {
      "url": "https://www.pragmaticinstitute.com/product/course/foundations/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Foundations page explains the Foundations/Focus/Build Product Manager certification path."
    },
    "claroty-cert-eng": {
      "url": "https://claroty.com/xcel-enablement-and-training",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official partner academy. Exact 'Platform Certified Engineer' title and access requirements need partner-portal confirmation.",
      "credentialStatus": "UNCONFIRMED"
    },
    "bcs-esa": {
      "url": "https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/it-architecture/bcs-practitioner-certificate-in-enterprise-and-solutions-architecture/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "cismp": {
      "url": "https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/information-security-and-data-protection-certifications/bcs-foundation-certificate-in-information-security-management-principles/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "itil-4-foundation": {
      "url": "https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official ITIL qualification catalogue; confirm version and transition route before booking."
    },
    "itil-4-mp": {
      "url": "https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official ITIL qualification catalogue; confirm version and transition route before booking."
    },
    "prince2-prac": {
      "url": "https://www.peoplecert.org/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer lists PRINCE2 Project Management Practitioner Version 7; use product details to verify booking."
    },
    "cdcdp": {
      "url": "https://cnet-training.com/programs/certified-data-centre-design-professional-cdcdp/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "sabsa-found": {
      "url": "https://sabsa.org/certification/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official SABSA certification programme. Confirm current module naming and provider delivery details."
    },
    "mad": {
      "url": "https://mad20.com/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Current MAD20 programme; generic tracker entry is not a single exam."
    },
    "caisp": {
      "url": "https://www.practical-devsecops.com/certified-ai-security-professional/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "meddic-found": {
      "url": "https://meddic.academy/meddic-certified-certificates-credentials/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Training-provider programme. Foundation course completion is not automatically a full MEDDPICC credential.",
      "credentialStatus": "UNCONFIRMED"
    },
    "meddpicc-master": {
      "url": "https://meddicc.com/meddpicc-masterclass-lp",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Masterclass completion certification; verify exact provider-specific credential rather than a universal Master qualification.",
      "credentialStatus": "UNCONFIRMED"
    },
    "wiz-cse": {
      "url": "https://www.wiz.io/wiz-certified",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Wiz Certified programme; exact Solution Engineer title requires confirmation.",
      "credentialStatus": "UNCONFIRMED"
    },
    "splunk-power-user": {
      "url": "https://www.splunk.com/en_us/training/certification.html",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Splunk certification catalogue; exact exam route requires the associated track page."
    },
    "splunk-core-user": {
      "url": "https://www.splunk.com/en_us/training/certification.html",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Splunk certification catalogue; exact exam route requires the associated track page."
    },
    "splunk-scde": {
      "url": "https://www.splunk.com/en_us/training/certification.html",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Splunk certification catalogue; exact exam route requires the associated track page."
    },
    "splunk-scda": {
      "url": "https://www.splunk.com/en_us/training/certification-track/splunk-certified-cybersecurity-defense-analyst.html",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "pan-apprentice": {
      "url": "https://www.paloaltonetworks.co.uk/services/education/certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official role-based programme catalogue; exact track page is not yet audited."
    },
    "pan-practitioner": {
      "url": "https://www.paloaltonetworks.co.uk/services/education/certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official role-based programme catalogue; exact track page is not yet audited."
    },
    "pan-netsec-analyst": {
      "url": "https://www.paloaltonetworks.co.uk/services/education/certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official role-based programme catalogue; exact track page is not yet audited."
    },
    "pan-secops-pro": {
      "url": "https://www.paloaltonetworks.co.uk/services/education/certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official role-based programme catalogue; exact track page is not yet audited."
    },
    "pan-xdr-analyst": {
      "url": "https://www.paloaltonetworks.co.uk/services/education/certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official role-based programme catalogue; exact track page is not yet audited."
    },
    "pan-xdr-eng": {
      "url": "https://www.paloaltonetworks.co.uk/services/education/certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official role-based programme catalogue; exact track page is not yet audited."
    },
    "pan-xsiam-eng": {
      "url": "https://www.paloaltonetworks.co.uk/services/education/certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official role-based programme catalogue; exact track page is not yet audited."
    },
    "pan-xsoar-eng": {
      "url": "https://www.paloaltonetworks.co.uk/services/education/certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official role-based programme catalogue; exact track page is not yet audited."
    },
    "pan-cloudsec-pro": {
      "url": "https://www.paloaltonetworks.co.uk/services/education/certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official role-based programme catalogue; exact track page is not yet audited."
    },
    "iec-62443-cfs": {
      "url": "https://www.isa.org/certification/certificate-programs/isa-iec-62443-cybersecurity-certificate-program",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme explicitly lists all four specialist certificates."
    },
    "iec-62443-cra": {
      "url": "https://www.isa.org/certification/certificate-programs/isa-iec-62443-cybersecurity-certificate-program",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme explicitly lists all four specialist certificates."
    },
    "iec-62443-cds": {
      "url": "https://www.isa.org/certification/certificate-programs/isa-iec-62443-cybersecurity-certificate-program",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme explicitly lists all four specialist certificates."
    },
    "iec-62443-cms": {
      "url": "https://www.isa.org/certification/certificate-programs/isa-iec-62443-cybersecurity-certificate-program",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme explicitly lists all four specialist certificates."
    },
    "togaf-10": {
      "url": "https://www.opengroup.org/certifications/togaf-certification-portfolio",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official TOGAF portfolio; select Enterprise Architecture Foundation/Practitioner rather than legacy TOGAF 9."
    },
    "esri-ent-admin": {
      "url": "https://www.esri.com/en-us/training/certification/exams",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official exam catalogue; legacy/specialty names must be checked against current available exams."
    },
    "esri-ent-prof": {
      "url": "https://www.esri.com/en-us/training/certification/exams/arcgis-enterprise-administration-professional-2025",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official 2025 exam page; current title/version takes precedence over legacy catalogue wording."
    },
    "esri-system-design": {
      "url": "https://www.esri.com/en-us/training/certification/exams",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official exam catalogue; legacy/specialty names must be checked against current available exams."
    },
    "esri-dev-found": {
      "url": "https://www.esri.com/en-us/training/certification/exams",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official exam catalogue; legacy/specialty names must be checked against current available exams."
    },
    "arcgis-py-api": {
      "url": "https://www.esri.com/en-us/training/certification/exams",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official exam catalogue; legacy/specialty names must be checked against current available exams."
    },
    "esri-online-admin": {
      "url": "https://www.esri.com/en-us/training/certification/exams",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official exam catalogue; legacy/specialty names must be checked against current available exams."
    },
    "esri-geodata-prof": {
      "url": "https://www.esri.com/en-us/training/certification/exams",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official exam catalogue; legacy/specialty names must be checked against current available exams."
    },
    "arcgis-foundation": {
      "url": "https://www.esri.com/en-us/training/certification/exams/arcgis-pro-foundation-2025",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official 2025 exam page; current title/version takes precedence over legacy catalogue wording."
    },
    "arcgis-associate": {
      "url": "https://www.esri.com/en-us/training/certification/exams",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official exam catalogue; legacy/specialty names must be checked against current available exams."
    },
    "arcgis-utility-net": {
      "url": "https://www.esri.com/en-us/training/certification/exams",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official exam catalogue; legacy/specialty names must be checked against current available exams."
    },
    "arcgis-pro-pro": {
      "url": "https://www.esri.com/en-us/training/certification/exams",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official exam catalogue; legacy/specialty names must be checked against current available exams."
    },
    "gcp-ace": {
      "url": "https://cloud.google.com/learn/certification",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official catalogue explicitly identifies this certification and links its exam guide."
    },
    "gcp-pcse": {
      "url": "https://cloud.google.com/learn/certification",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official catalogue explicitly identifies this certification and links its exam guide."
    },
    "gcp-pca": {
      "url": "https://cloud.google.com/learn/certification",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official catalogue explicitly identifies this certification and links its exam guide."
    },
    "gcp-pcne": {
      "url": "https://cloud.google.com/learn/certification",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official catalogue explicitly identifies this certification and links its exam guide."
    },
    "gcp-pcde": {
      "url": "https://cloud.google.com/learn/certification",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official catalogue explicitly identifies this certification and links its exam guide."
    },
    "aaism": {
      "url": "https://www.isaca.org/credentialing/certifications",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credentialing page explicitly identifies this certification."
    },
    "cism": {
      "url": "https://www.isaca.org/credentialing/certifications",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credentialing page explicitly identifies this certification."
    },
    "crisc": {
      "url": "https://www.isaca.org/credentialing/certifications",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credentialing page explicitly identifies this certification."
    },
    "cisa": {
      "url": "https://www.isaca.org/credentialing/certifications",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credentialing page explicitly identifies this certification."
    },
    "cdpse": {
      "url": "https://www.isaca.org/credentialing/certifications",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credentialing page explicitly identifies this certification."
    },
    "ccsp": {
      "url": "https://www.isc2.org/certifications",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official portfolio explicitly identifies this credential and experience requirements."
    },
    "issap": {
      "url": "https://www.isc2.org/certifications",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official portfolio explicitly identifies this credential and experience requirements."
    },
    "csslp": {
      "url": "https://www.isc2.org/certifications",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official portfolio explicitly identifies this credential and experience requirements."
    },
    "crowdstrike-ccf": {
      "url": "https://www.crowdstrike.com/en-us/crowdstrike-university/crowdstrike-falcon-certification-program/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme names the credential and links its individual exam guide."
    },
    "crowdstrike-ccfh": {
      "url": "https://www.crowdstrike.com/en-us/crowdstrike-university/crowdstrike-falcon-certification-program/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme names the credential and links its individual exam guide."
    },
    "crowdstrike-ccsa": {
      "url": "https://www.crowdstrike.com/en-us/crowdstrike-university/crowdstrike-falcon-certification-program/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme names the credential and links its individual exam guide."
    },
    "crowdstrike-ccse": {
      "url": "https://www.crowdstrike.com/en-us/crowdstrike-university/crowdstrike-falcon-certification-program/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme names the credential and links its individual exam guide."
    },
    "crowdstrike-ccis": {
      "url": "https://www.crowdstrike.com/en-us/crowdstrike-university/crowdstrike-falcon-certification-program/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme names the credential and links its individual exam guide."
    },
    "crowdstrike-cccs": {
      "url": "https://www.crowdstrike.com/en-us/crowdstrike-university/crowdstrike-falcon-certification-program/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official programme names the credential and links its individual exam guide."
    },
    "aws-cloud-practitioner": {
      "url": "https://aws.amazon.com/certification/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "aws-saa": {
      "url": "https://aws.amazon.com/certification/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "aws-sap": {
      "url": "https://aws.amazon.com/certification/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "aws-security-specialty": {
      "url": "https://aws.amazon.com/certification/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "aws-dop": {
      "url": "https://aws.amazon.com/certification/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "gicsp": {
      "url": "https://www.giac.org/certifications/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "grid": {
      "url": "https://www.giac.org/certifications/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "grem": {
      "url": "https://www.giac.org/certifications/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "gcfa": {
      "url": "https://www.giac.org/certifications/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "gcih": {
      "url": "https://www.giac.org/certifications/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "gcda": {
      "url": "https://www.giac.org/certifications/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "gaips": {
      "url": "https://www.giac.org/certifications/",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official issuer programme; certification-specific details still need verification."
    },
    "nse-4": {
      "url": "https://www.fortinet.com/training-certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Fortinet programme. Verify current NSE/industry track and booking requirements."
    },
    "fcss-secops": {
      "url": "https://www.fortinet.com/training-certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Fortinet programme. Verify current NSE/industry track and booking requirements."
    },
    "fcx": {
      "url": "https://www.fortinet.com/training-certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Fortinet programme. Verify current NSE/industry track and booking requirements."
    },
    "fortinet-ot-security": {
      "url": "https://www.fortinet.com/training-certification",
      "level": "VENDOR",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Fortinet programme. Verify current NSE/industry track and booking requirements."
    },
    "google-cyber": {
      "url": "https://grow.google/certificates/cybersecurity/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official Google Cybersecurity Certificate page."
    },
    "hashicorp-vault": {
      "url": "https://developer.hashicorp.com/certifications/security-automation",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official HashiCorp Vault certification programme."
    },
    "ccna": {
      "url": "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official CCNA credential page."
    },
    "sc-900": {
      "url": "https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "az-700": {
      "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-network-engineer-associate/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "az-140": {
      "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-virtual-desktop-specialty/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "sc-200": {
      "url": "https://learn.microsoft.com/en-us/credentials/certifications/security-operations-analyst/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "sc-401": {
      "url": "https://learn.microsoft.com/en-us/credentials/certifications/information-security-administrator/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "sc-100": {
      "url": "https://learn.microsoft.com/en-us/credentials/certifications/cybersecurity-architect-expert/",
      "level": "CERT",
      "sourceCheckedAt": "2026-09-02",
      "note": "Official credential page; source identity checked, not a full price/content audit."
    },
    "cysa-plus": {
      "url": "https://www.comptia.org/certifications",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit CompTIA issuer mapping; automated page inspection unavailable. No new detail-verification date asserted.",
      "sourceAudited": false
    },
    "linux-plus": {
      "url": "https://www.comptia.org/certifications",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit CompTIA issuer mapping; automated page inspection unavailable. No new detail-verification date asserted.",
      "sourceAudited": false
    },
    "autoops-plus": {
      "url": "https://www.comptia.org/certifications",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit CompTIA issuer mapping; automated page inspection unavailable. No new detail-verification date asserted.",
      "sourceAudited": false
    },
    "server-plus": {
      "url": "https://www.comptia.org/certifications",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit CompTIA issuer mapping; automated page inspection unavailable. No new detail-verification date asserted.",
      "sourceAudited": false
    },
    "pentest-plus": {
      "url": "https://www.comptia.org/certifications",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit CompTIA issuer mapping; automated page inspection unavailable. No new detail-verification date asserted.",
      "sourceAudited": false
    },
    "securityx": {
      "url": "https://www.comptia.org/certifications",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit CompTIA issuer mapping; automated page inspection unavailable. No new detail-verification date asserted.",
      "sourceAudited": false
    },
    "secot-plus": {
      "url": "https://www.comptia.org/certifications",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit CompTIA issuer mapping; automated page inspection unavailable. No new detail-verification date asserted.",
      "sourceAudited": false
    },
    "acp": {
      "url": "https://www.axis.com/learning/certification-program",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Existing official Axis programme mapping; certification-specific inspection pending.",
      "sourceAudited": false
    },
    "mcit": {
      "url": "https://www.milestonesys.com/learn-and-support/learning-and-performance/",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Existing official Milestone training route; exact course access/details require verification.",
      "sourceAudited": false
    },
    "mcie": {
      "url": "https://www.milestonesys.com/learn-and-support/learning-and-performance/",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Existing official Milestone training route; exact course access/details require verification.",
      "sourceAudited": false
    },
    "mcde": {
      "url": "https://www.milestonesys.com/learn-and-support/learning-and-performance/",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Existing official Milestone training route; exact course access/details require verification.",
      "sourceAudited": false
    },
    "lca": {
      "url": "https://www.lenels2.com/en/training/",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit LenelS2 training route; partner access and exact credential details require verification.",
      "sourceAudited": false
    },
    "lcp": {
      "url": "https://www.lenels2.com/en/training/",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit LenelS2 training route; partner access and exact credential details require verification.",
      "sourceAudited": false
    },
    "lce": {
      "url": "https://www.lenels2.com/en/training/",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit LenelS2 training route; partner access and exact credential details require verification.",
      "sourceAudited": false
    },
    "lcda": {
      "url": "https://www.lenels2.com/en/training/",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Explicit LenelS2 training route; partner access and exact credential details require verification.",
      "sourceAudited": false
    },
    "arcules-csp": {
      "url": "https://arcules.com/",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Official Arcules issuer site; exact sales credential and current training route unconfirmed.",
      "sourceAudited": false
    },
    "briefcam-tech": {
      "url": "https://www.milestonesys.com/products/software/briefcam/",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Official BriefCam product-family source, not evidence of a standalone certification. Training access requires confirmation.",
      "sourceAudited": false
    },
    "cmss": {
      "url": "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/index.html",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Official Cisco programme; legacy Meraki specialist exam availability requires confirmation.",
      "sourceAudited": false
    },
    "thm-sec0": {
      "url": "https://tryhackme.com/paths",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Official learning paths; completion certificates and professional exam credentials must not be conflated.",
      "sourceAudited": false
    },
    "thm-sec1": {
      "url": "https://tryhackme.com/paths",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Official learning paths; completion certificates and professional exam credentials must not be conflated.",
      "sourceAudited": false
    },
    "thm-sal1": {
      "url": "https://tryhackme.com/paths",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Official learning paths; completion certificates and professional exam credentials must not be conflated.",
      "sourceAudited": false
    },
    "thm-se1": {
      "url": "https://tryhackme.com/paths",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Official learning paths; completion certificates and professional exam credentials must not be conflated.",
      "sourceAudited": false
    },
    "thm-pt1": {
      "url": "https://tryhackme.com/paths",
      "level": "VENDOR",
      "sourceCheckedAt": null,
      "note": "Official learning paths; completion certificates and professional exam credentials must not be conflated.",
      "sourceAudited": false
    }
  };
  CT.sourceRegistry=Object.freeze({...CT.sourceRegistry,...Object.fromEntries(Object.entries({...extra,...coverage}).map(([id,row])=>[id,Object.freeze(row)]))});
})(window);
