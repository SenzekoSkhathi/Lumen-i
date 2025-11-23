import React, { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import {
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon,
  PrivacyTip as PrivacyTipIcon,
  Cookie as CookieIcon,
  People as PeopleIcon,
  Copyright as CopyrightIcon,
} from "@mui/icons-material";

export default function Terms() {
  const { darkMode } = useOutletContext();
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const accordionStyle = {
    bgcolor: darkMode ? "#2A2A2A" : "#f9f9f9",
    color: darkMode ? "#FFFFFF" : "#000000",
    mb: 1.5,
    borderRadius: 2,
    boxShadow: "none",
    "&.Mui-expanded": {
      margin: 0,
      marginBottom: 1.5,
    },
    "&:before": {
      display: "none", // Removes the default 1px border
    },
  };

  const summaryTextStyle = {
    fontWeight: 500,
    fontSize: "1.1rem",
  };

  const detailsTextStyle = {
    opacity: 0.9,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap", // Preserves line breaks
  };

  const placeholderText =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit leo lobortis eget. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit leo lobortis eget.\n\n1. Introduction: Welcome to Lumeni. By accessing our service, you agree to these terms.\n2. User Accounts: You are responsible for your account's activity and password.\n3. Content: Our service and its original content, features, and functionality are owned by Lumeni.\n4. Termination: We may terminate or suspend your account immediately, without prior notice, for any reason.\n5. Governing Law: These Terms shall be governed by the laws of our country, without regard to its conflict of law provisions.";

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", color: darkMode ? "#fff" : "#000" }}>
      <Typography variant="h4" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
        Policy & T's & C's
      </Typography>

      {/* --- Section 1: Terms & Conditions --- */}
      <Accordion
        expanded={expanded === "panel1"}
        onChange={handleChange("panel1")}
        sx={accordionStyle}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
          <GavelIcon sx={{ mr: 1.5, opacity: 0.8 }} />
          <Typography sx={summaryTextStyle}>Terms & Conditions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={detailsTextStyle}>{placeholderText}</Typography>
        </AccordionDetails>
      </Accordion>

      {/* --- Section 2: Privacy Policy --- */}
      <Accordion
        expanded={expanded === "panel2"}
        onChange={handleChange("panel2")}
        sx={accordionStyle}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
          <PrivacyTipIcon sx={{ mr: 1.5, opacity: 0.8 }} />
          <Typography sx={summaryTextStyle}>Privacy Policy</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={detailsTextStyle}>
            {placeholderText.replace("Terms", "Privacy Policy")}
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* --- Section 3: Cookie Policy --- */}
      <Accordion
        expanded={expanded === "panel3"}
        onChange={handleChange("panel3")}
        sx={accordionStyle}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
          <CookieIcon sx={{ mr: 1.5, opacity: 0.8 }} />
          <Typography sx={summaryTextStyle}>Cookie Policy</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={detailsTextStyle}>
            {placeholderText.replace("Terms", "Cookie Policy")}
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* --- Section 4: Community Guidelines --- */}
      <Accordion
        expanded={expanded === "panel4"}
        onChange={handleChange("panel4")}
        sx={accordionStyle}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
          <PeopleIcon sx={{ mr: 1.5, opacity: 0.8 }} />
          <Typography sx={summaryTextStyle}>Community Guidelines</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={detailsTextStyle}>
            {placeholderText.replace("Terms", "Community Guidelines")}
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* --- Section 5: Copyright & DMCA Policy --- */}
      <Accordion
        expanded={expanded === "panel5"}
        onChange={handleChange("panel5")}
        sx={accordionStyle}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
          <CopyrightIcon sx={{ mr: 1.5, opacity: 0.8 }} />
          <Typography sx={summaryTextStyle}>Copyright & DMCA Policy</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={detailsTextStyle}>
            {placeholderText.replace("Terms", "Copyright Policy")}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}