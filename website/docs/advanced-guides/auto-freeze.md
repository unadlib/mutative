---
sidebar_position: 3
---

# Auto Freeze

Enable autoFreeze, and return frozen state, and enable circular reference checking only in development mode.

## Enable Auto Freeze

The `enableAutoFreeze` option is likely a feature that controls the immutability of objects in the state. When enabled, this option would automatically freeze state objects to prevent them from being modified. This is a common practice in immutable state management, ensuring that state objects are not changed inadvertently, which can lead to unpredictable behaviors in applications.

Key aspects of the `enableAutoFreeze` option in Mutative might include:

1. **Immutability Enforcement**: The primary purpose of `enableAutoFreeze` is to enforce immutability in the state objects. By freezing the objects, it ensures that they cannot be modified once they are created or updated.

2. **Debugging Aid**: This option can be particularly helpful in a development environment where detecting unintended mutations can be crucial. By freezing state objects, any attempts to modify them would result in an error, helping developers identify and fix bugs related to state mutations.

3. **Performance Considerations**: In some cases, freezing objects can have performance implications, especially if the state is large or complex. The option to enable or disable auto-freezing allows developers to make decisions based on the specific performance needs of their application.

4. **Optional Use**: As an option, `enableAutoFreeze` provides flexibility. Developers can choose to enable it in development environments for added safety and disable it in production for improved performance, depending on their requirements.

5. **Compatibility with State Management Practices**: This feature aligns with the principles of immutable state management, a practice widely adopted in modern application development for its benefits in predictability, simplicity, and ease of debugging.

In summary, the `enableAutoFreeze` option is a useful feature for developers who want to enforce immutability in their application's state. It provides both a safeguard against unintended mutations and a tool for maintaining clean and predictable state management.

:::tip
In order to the security and protection of the updated data in development mode, and the performance in production mode, we recommend that you `enable` auto freeze in development and `disable` it in production.
:::
