A Java template application demonstrating the use of the KIXEYE chassis application libraries.
        JSObject

        protected JSObject()

        Constructs a new JSObject. Users should not call this method nor subclass JSObject.

    Method Detail
        call

        public abstract java.lang.Object call(java.lang.String methodName,
                            java.lang.Object... args)
                                       throws JSException

        Calls a JavaScript method. Equivalent to "this.methodName(args[0], args[1], ...)" in JavaScript.

        Parameters:
            methodName - The name of the JavaScript method to be invoked.
            args - An array of Java object to be passed as arguments to the method.
        Returns:
            Result of the method.
        Throws:
            JSException

        eval

        public abstract java.lang.Object eval(java.lang.String s)
                                       throws JSException

        Evaluates a JavaScript expression. The expression is a string of JavaScript source code which will be evaluated in the context given by "this".

        Parameters:
            s - The JavaScript expression.
        Returns:
            Result of the JavaScript evaluation.
        Throws:
            JSException

        getMember

        public abstract java.lang.Object getMember(java.lang.String name)
                                            throws JSException

        Retrieves a named member of a JavaScript object. Equivalent to "this.name" in JavaScript.

        Parameters:
            name - The name of the JavaScript property to be accessed.
        Returns:
            The value of the propery.
        Throws:
            JSException

        setMember

        public abstract void setMember(java.lang.String name,
                     java.lang.Object value)
                                throws JSException

        Sets a named member of a JavaScript object. Equivalent to "this.name = value" in JavaScript.

        Parameters:
            name - The name of the JavaScript property to be accessed.
            value - The value of the propery.
        Throws:
            JSException

        removeMember

        public abstract void removeMember(java.lang.String name)
                                   throws JSException

        Removes a named member of a JavaScript object. Equivalent to "delete this.name" in JavaScript.

        Parameters:
            name - The name of the JavaScript property to be removed.
        Throws:
            JSException

        getSlot

        public abstract java.lang.Object getSlot(int index)
                                          throws JSException

        Retrieves an indexed member of a JavaScript object. Equivalent to "this[index]" in JavaScript.

        Parameters:
            index - The index of the array to be accessed.
        Returns:
            The value of the indexed member.
        Throws:
            JSException

        setSlot

        public abstract void setSlot(int index,
                   java.lang.Object value)
                              throws JSException

        Sets an indexed member of a JavaScript object. Equivalent to "this[index] = value" in JavaScript.

        Parameters:
            index - The index of the array to be accessed.
        Throws:
            JSException


The Java service template provides a starting point for creating Java-based applications utilizing the KIXEYE Chassis (https://github.com/GistIcon/chassis-java-service-template)
(http://www.oracle.com/technetwork/java/javase/certconfig-2095354.html#browsers)
family of application libraries.

Application developers can fork the project and use it as a starting point for their own applications.
at: [l>l](https://www.kixeye.com/groups/custom/5423b86acf9dcde431284254/apply)
