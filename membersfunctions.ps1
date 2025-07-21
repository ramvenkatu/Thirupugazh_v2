-- ===============================================================
--  M embers Table Setup
-- ===============================================================

-- Drop the table if it already exists to avoid errors on re-run
DROP TABLE IF EXISTS `members`;

-- Create the members table
CREATE TABLE `members` (
    `id` INT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `address` TEXT,
    `phone_numbers` VARCHAR(255)
);

-- Insert data into the members table from members.js
INSERT INTO `members` (`id`, `name`, `address`, `phone_numbers`) VALUES
(1, 'Smt & Sri Radha Ananthasivam', '75,Mudappa road , M.S .Ngr, B-33', '9880550882'),
(2, 'Bharati', '#92,Shastri Nilayam, Anjanappa Layout,Horamavu,B-43', '9945478713'),
(3, 'Saraswati Ram', '21,G-3,Shanta Paradise Aptt, Wheeler Rd,Cox Town', '8904316334,9343434141'),
(4, 'Smt & Sri.Maragatam Sivasubramanian', '35,2nd Cross,Swami Vivekananda Layout, Jayanti Ngr,Horamavu Rd, Land Mark:Vibgyor High School & Asha Kiran Special Needs-B-43', '9008183622,9902000676'),
(5, 'Smt & Sri.Sujatha Krishnamurthy', 'B-305,Fortuna Krrish , K-Channa Sandra, Kalkere,Horamavu,B-43', '9686955751'),
(6, 'I V P – Bhajan @ Sura Bharathi', 'Service Road,Kalyana nagar – B-43', '9341735565,9739006635'),
(7, 'Jala Vayu TOWER', 'Sadanand Nagar, Detail will follow', '9481029853'),
(8, 'Smt & Sri.Uma Suresh', 'A-703,Jain Heights,Hennur Road,', '9551090001'),
(9, 'Aanandavalli Kothandaraman', '#9,Anjanappa Layout, Horamavu Main Road,B-43', '9845383953,8618391875'),
(10, 'Veda Mani Nivas', '75,Muddappa Road Cross, Jaibharat Nagar , B-33', '8197121623,9900689454'),
(11, 'Sri P.A.Srinivasa Bhagavatar', '“Lakshmi”, # 43 , 3rd Main,1st Block, Sir M.V.Ngr,B-16.', '9481029853'),
(12, 'Shakti Mantapam', 'Sakti Nagar,Near Cloud Nine Hospital, Service Road, Near Horamavu Signal,B-43.', '8197275215,9739006635'),
(13, 'Smt.Sri.Bhama Venkataraman', '#52,Muni Reddy Layout , 1st Cross, Horamavu Main Road,B-43.', '9916389405,9739006635'),
(14, 'Smt.Priya & Sri.J.Ganesh', '# 5M-601, Vega Eternity, Flat # 202, 2nd Floor, Banaswadi, B-43.', '9841227703,9841417703'),
(15, 'Smt.Nalini& Sri.Sri.M.Kartikeyan', '#203,4th B cross, 3rd Main, OMBR Layout, Banaswadi , B-43.', '7975098916,9686200925'),
(16, 'Smt.Vaidehi & Sri.Nagasubramanian', '#92, 9th Street, Anjanappa Layout, Horamavu Main Road, B-43.', '9448349081,9916270585'),
(17, 'Smt & Sri.Usha S.Raghavan', '#8,Anjanappa Lay out,3rd Cross, Horamavu Main Road, B-43.', '8197275215,6362821237'),
(18, 'Smt.Vijayalakshmi Sri.Murali', '#9,Anjanappa Lay out,3rd Cross, Horamavu Main Road, B-43.', '8217895799'),
(19, 'Smt.Kruththika & Sri.Shankar', '#252,Mayura Towers,R R Layout, Old UCO Bank Road,Vijinapura,K R puram', '9663842000,9003085855'),
(20, 'Mrs.Radha Manoj', '201,2nd Floor,3rd Main”Vunnam Heights" Anjanappa Layout,Horamavu,B-43', '7026377702'),
(21, 'Mrs.Saraswati Vaidhynathan', 'A101,Pearl Aprtt 3rd Main,Horamavu Main Road,B-43', '8197562009,8903888966'),
(22, 'Sri.Chitra Vinayakar Temple', 'Opposite to Ramesh Jewellers M.S.Ngr,B-560043.', '8197121623,9900689454');


-- ===============================================================
--  Functions Table Setup
-- ===============================================================

-- Drop the table if it already exists
DROP TABLE IF EXISTS `functions`;

-- Create the functions table
CREATE TABLE `functions` (
    `id` INT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL
);

-- Insert data into the functions table from functions.js
INSERT INTO `functions` (`id`, `name`) VALUES
(1, 'ஆடி க்ருத்திகை'),
(2, 'ஆடி வெள்ளி-1'),
(3, 'ஆடி வெள்ளி-2'),
(4, 'ஆடி வெள்ளி-3'),
(5, 'ஆடி வெள்ளி-4'),
(6, 'ஆடி வெள்ளி-5'),
(7, 'ஆனி மூலம்'),
(8, 'குரு பூர்ணிமா'),
(9, 'அதிக பஜனை'),
(10, 'க்ருத்திகை'),
(11, 'தை க்ருத்திகை'),
(12, 'தை பூசம்'),
(13, 'தை வெள்ளி-2'),
(14, 'தை வெள்ளி-5'),
(15, 'தைவெள்ளி-3'),
(16, 'தைவெள்ளி-4'),
(17, 'மூலம்'),
(18, 'வள்ளி கல்யாண மஹோத்ஸவம்'),
(19, 'விஶாகம்'),
(20, 'வெள்ளி-1'),
(21, 'வைகாஶி விஶாகம்'),
(22, 'ஶஷ்டி'),
(23, 'ஸ்கந்த ஶஷ்டி'),
(24, 'ஸ்கந்த ஶஷ்டி-இரண்டாம் நாள்'),
(25, 'ஸ்கந்த ஶஷ்டி-ஐந்தாம் நாள்'),
(26, 'ஸ்கந்த ஶஷ்டி-நான்காம் நாள்'),
(27, 'ஸ்கந்த ஶஷ்டி-முதல் நாள்'),
(28, 'ஸ்கந்த ஶஷ்டி-மூன்றாம் நாள்'),
(29, 'ஶஷ்டி / க்ருத்திகை');