CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-',''),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) DEFAULT 'USER' NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE lead (
    id VARCHAR(255) PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-',''),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255),
    company VARCHAR(255),
    status VARCHAR(255) DEFAULT 'NEW' NOT NULL,
    assignedTo VARCHAR(255),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "Lead_assignedTo_fkey" FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE opportunity (
    id VARCHAR(255) PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-',''),
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    stage VARCHAR(255) DEFAULT 'PROSPECT' NOT NULL,
    leadId VARCHAR(255) NOT NULL,
    assignedTo VARCHAR(255),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "Opportunity_leadId_fkey" FOREIGN KEY (leadId) REFERENCES lead(id) ON DELETE CASCADE,
    CONSTRAINT "Opportunity_assignedTo_fkey" FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE staff (
    id VARCHAR(255) PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-',''),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    phone VARCHAR(255),
    status VARCHAR(255) DEFAULT 'ACTIVE' NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL
);